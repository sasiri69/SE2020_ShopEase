import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Image, ScrollView, Platform, Modal, TextInput } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { pickSingleImage } from "../utils/imagePicker";
import { resolveImageUrl } from "../utils/imageUrl";
import { colors, fonts, layout } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const STATUS_THEME = {
  Pending: { color: colors.accent, soft: colors.accentSoft },
  InTransit: { color: colors.primary, soft: colors.primarySoft },
  Delivered: { color: colors.success, soft: colors.successSoft },
  Failed: { color: colors.danger, soft: colors.dangerSoft },
};

export function AdminDeliveryManageScreen({ route, navigation }) {
  const { id } = route.params;
  const { api, user } = useContext(AuthContext);
  const [delivery, setDelivery] = useState(null);
  const [payment, setPayment] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  function showMessage(title, message) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  }

  async function load() {
    const res = await api.get(`/deliveries/${id}`);
    setDelivery(res.data);
    if (res.data.orderId?._id) {
      try {
        const pRes = await api.get(`/payments/${res.data.orderId._id}`);
        setPayment(pRes.data);
      } catch (e) {
        // Payment might not exist yet or error (e.g. 404)
        setPayment(null);
      }
    }
  }

  useEffect(() => {
    load().catch((e) => Alert.alert("Error", e?.response?.data?.message || e.message));
  }, [id]);

  if (user?.role !== "admin" && user?.role !== "delivery" && user?.role !== "driver") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Delivery Details</Text>
        <Text style={styles.muted}>Access denied. Please contact support.</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading task details...</Text>
      </View>
    );
  }

  const order = delivery.orderId;
  const isDriver = user?.role === "driver";
  const myUserId = user?._id || user?.id;
  const assignedDriverId = delivery.driverId?._id || delivery.driverId;
  const isAssignedToMe = Boolean(assignedDriverId && myUserId && String(assignedDriverId) === String(myUserId));
  const isUnassigned = !delivery.driverId;
  const canManage = isDriver && isAssignedToMe;
  const theme = STATUS_THEME[delivery.status] || { color: colors.textSecondary, soft: colors.surfaceAlt };

  async function claimDelivery() {
    try {
      setClaiming(true);
      const res = await api.post(`/deliveries/${delivery._id}/claim`);
      setDelivery(res.data);
      showMessage("Assignment Confirmed", "This delivery task is now assigned to you.");
    } catch (e) {
      showMessage("Claim Failed", e?.response?.data?.message || e.message);
    } finally {
      setClaiming(false);
    }
  }

  async function setStatus(status) {
    try {
      const res = await api.put(`/deliveries/${delivery._id}/status`, { status });
      setDelivery(res.data);
      showMessage("Status Updated", `The delivery is now ${status.toLowerCase()}.`);
    } catch (e) {
      showMessage("Update Failed", e?.response?.data?.message || e.message);
    }
  }

  async function reportFailure() {
    if (failureReason.trim().length < 3) {
      showMessage("Validation", "Please provide a valid reason (at least 3 characters).");
      return;
    }
    try {
      const res = await api.post(`/deliveries/${delivery._id}/fail`, { reason: failureReason.trim() });
      setDelivery(res.data);
      setShowFailureModal(false);
      setFailureReason("");
      showMessage("Delivery Failed", "The delivery has been marked as failed.");
    } catch (e) {
      showMessage("Report Failed", e?.response?.data?.message || e.message);
    }
  }

  async function verifyPayment() {
    if (!payment) return;
    try {
      setVerifying(true);
      const res = await api.put(`/payments/${payment._id}/verify`, { status: "Verified" });
      setPayment(res.data);
      showMessage("Payment Verified", "The order payment has been successfully confirmed.");
      await load(); // Refresh to update order status
    } catch (e) {
      showMessage("Verification Failed", e?.response?.data?.message || e.message);
    } finally {
      setVerifying(false);
    }
  }

  async function uploadProof() {
    try {
      setUploadingProof(true);
      const asset = await pickSingleImage();
      if (!asset) return;
      const fd = new FormData();
      const fileName = asset.fileName || `proof-${Date.now()}.jpg`;
      const fileType = asset.mimeType || "image/jpeg";

      if (Platform.OS === "web") {
        if (asset.file) {
          fd.append("proofImage", asset.file, fileName);
        } else {
          const blob = await fetch(asset.uri).then((r) => r.blob());
          fd.append("proofImage", blob, fileName);
        }
      } else {
        fd.append("proofImage", {
          uri: asset.uri,
          name: fileName,
          type: fileType,
        });
      }

      // Let axios set multipart boundary automatically.
      const res = await api.post(`/deliveries/${delivery._id}/proof-image`, fd);

      if (!res?.data?.proofImage) {
        throw new Error("Upload completed but proof image URL was not returned.");
      }

      setDelivery(res.data);
      showMessage("Proof Shared", "Delivery proof uploaded successfully. No separate submit is required.");
    } catch (e) {
      showMessage("Upload Failed", e?.response?.data?.message || e.message);
    } finally {
      setUploadingProof(false);
    }
  }

  async function deleteRecord() {
    const message = "Only delivered records can be deleted. This action cannot be undone.";
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" ? window.confirm(message) : true;
      if (!ok) return;
      try {
        await api.delete(`/deliveries/${delivery._id}`);
        showMessage("Deleted", "Delivery record deleted successfully.");
        navigation.goBack();
      } catch (e) {
        showMessage("Delete Failed", e?.response?.data?.message || e.message);
      }
      return;
    }

    Alert.alert("Delete record?", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/deliveries/${delivery._id}`);
            showMessage("Deleted", "Delivery record deleted successfully.");
            navigation.goBack();
          } catch (e) {
            showMessage("Delete Failed", e?.response?.data?.message || e.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.statusBanner, { backgroundColor: theme.soft }]}>
        <Ionicons name="ellipse" size={12} color={theme.color} />
        <Text style={[styles.statusText, { color: theme.color }]}>{delivery.status}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>TRACKING NUMBER</Text>
            <Text style={styles.infoValue}>{delivery.trackingNumber || "PENDING"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>CREATED ON</Text>
            <Text style={styles.infoValue}>{new Date(delivery.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <Text style={styles.infoLabel}>DESTINATION ADDRESS</Text>
        <Text style={styles.addressValue}>{delivery.address}</Text>

        {delivery.deliveredAt && (
          <>
            <View style={styles.divider} />
            <Text style={styles.infoLabel}>COMPLETED AT</Text>
            <Text style={styles.infoValue}>{new Date(delivery.deliveredAt).toLocaleString()}</Text>
          </>
        )}

        {delivery.status === "Failed" && delivery.failureReason ? (
          <>
            <View style={styles.divider} />
            <Text style={[styles.infoLabel, { color: colors.danger }]}>FAILURE REASON</Text>
            <Text style={styles.failureValue}>{delivery.failureReason}</Text>
          </>
        ) : null}
      </View>

      {order && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Customer & Order</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.userId?.name || "Premium Customer"}</Text>
              <Text style={styles.customerEmail}>{order.userId?.email || "No email available"}</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>LKR {Number(order.totalAmount).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.infoLabel}>ORDERED ITEMS</Text>
          {(order.items || []).map((item, idx) => {
            const product = item.productId;
            return (
              <View key={idx} style={styles.productRow}>
                <View style={styles.productThumb}>
                  {product?.images?.[0] ? (
                    <Image source={{ uri: product.images[0] }} style={styles.productImg} />
                  ) : (
                    <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={1}>{product?.name || "Product Item"}</Text>
                  <Text style={styles.productMeta}>Qty: {item.quantity} × LKR {Number(item.priceAtTime).toFixed(2)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {payment && user?.role === "admin" && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Verification</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>METHOD</Text>
              <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>STATUS</Text>
              <Text style={[styles.infoValue, { color: payment.status === "Verified" ? colors.success : colors.danger }]}>
                {payment.status}
              </Text>
            </View>
          </View>

          {payment.receiptImage && (
            <>
              <View style={styles.divider} />
              <Text style={styles.infoLabel}>RECEIPT IMAGE</Text>
              <View style={styles.imageCard}>
                <Image source={{ uri: resolveImageUrl(payment.receiptImage) }} style={styles.previewImg} />
              </View>
            </>
          )}

          {payment.codProofImage && (
            <>
              <View style={styles.divider} />
              <Text style={styles.infoLabel}>COD PROOF CARD</Text>
              <View style={styles.imageCard}>
                <Image source={{ uri: resolveImageUrl(payment.codProofImage) }} style={styles.previewImg} />
              </View>
            </>
          )}

          <View style={styles.divider} />
          <Text style={styles.infoLabel}>DELIVERY PROOF IMAGE</Text>
          {delivery.proofImage ? (
            <View style={styles.imageCard}>
              <Image source={{ uri: resolveImageUrl(delivery.proofImage) }} style={styles.previewImg} />
            </View>
          ) : (
            <View style={styles.noProofBox}>
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
              <Text style={styles.noProofText}>No delivery proof uploaded yet</Text>
            </View>
          )}

          {payment.status === "Pending" && (
            <Pressable 
              style={[styles.claimBtn, { marginTop: 20, backgroundColor: colors.success }]} 
              onPress={verifyPayment}
              disabled={verifying}
            >
              <Text style={styles.claimBtnText}>{verifying ? "Verifying..." : "Verify Payment"}</Text>
            </Pressable>
          )}
        </View>
      )}

      {isDriver && isUnassigned && delivery.status !== "Delivered" ? (
        <Pressable 
          style={({ pressed }) => [styles.claimBtn, (claiming || pressed) && styles.claimBtnPressed]} 
          onPress={claimDelivery} 
          disabled={claiming}
        >
          <Text style={styles.claimBtnText}>{claiming ? "Claiming..." : "Claim Assignment"}</Text>
        </Pressable>
      ) : null}

      {canManage && delivery.status !== "Delivered" && delivery.status !== "Failed" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusGroup}>
            {["Pending", "InTransit", "Delivered"].map((s) => {
              const sc = STATUS_THEME[s]?.color || colors.textSecondary;
              const isActive = delivery.status === s;
              // Cannot go backwards: if current is InTransit, Pending is disabled
              const isDisabled =
                (delivery.status === "InTransit" && s === "Pending");
              return (
                <Pressable
                  key={s}
                  style={[
                    styles.statusPill,
                    isActive && { backgroundColor: sc, borderColor: sc },
                    isDisabled && styles.btnDisabled,
                  ]}
                  onPress={() => !isDisabled && setStatus(s)}
                  disabled={isDisabled}
                >
                  <Text style={[styles.statusPillText, isActive && { color: colors.surface }]}>
                    {s === "InTransit" ? "In Transit" : s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable 
            style={styles.failBtn} 
            onPress={() => setShowFailureModal(true)}
          >
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={styles.failBtnText}>Report Delivery Failure</Text>
          </Pressable>
        </View>
      )}

      {(canManage || Boolean(delivery.proofImage && user?.role !== "admin")) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Confirmation</Text>
          
          {canManage && (
            <>
              <Text style={styles.uploadHint}>
                {delivery.status !== "Delivered" 
                  ? "Status must be set to 'Delivered' to upload proof." 
                  : "Upload a photo of the received package or receipt."}
              </Text>
              
              <Pressable
                style={[styles.uploadBtn, (delivery.status !== "Delivered" || uploadingProof) && styles.btnDisabled]}
                onPress={uploadProof}
                disabled={delivery.status !== "Delivered" || uploadingProof}
              >
                <Ionicons name="camera-outline" size={24} color={delivery.status === "Delivered" ? colors.primary : colors.textMuted} />
                <Text style={[styles.uploadBtnText, delivery.status === "Delivered" && { color: colors.primary }]}>
                  {uploadingProof
                    ? "Uploading..."
                    : delivery.proofImage
                      ? "Change Confirmation Photo"
                      : "Upload Proof of Delivery"}
                </Text>
              </Pressable>
            </>
          )}

          {delivery.proofImage && (
            <View style={[styles.proofContainer, !canManage && { marginTop: 10 }]}>
              <Image source={{ uri: resolveImageUrl(delivery.proofImage) }} style={styles.proofImg} />
            </View>
          )}
        </View>
      )}

      {user?.role === "admin" && delivery.status === "Delivered" ? (
        <Pressable style={styles.deleteBtn} onPress={deleteRecord}>
          <Ionicons name="trash-outline" size={18} color={colors.surface} />
          <Text style={styles.deleteBtnText}>Delete Delivered Record</Text>
        </Pressable>
      ) : null}

      <Modal
        visible={showFailureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={24} color={colors.danger} />
              <Text style={styles.modalTitle}>Report Failure</Text>
            </View>
            <Text style={styles.modalDescription}>
              Please explain why this delivery could not be completed. This will be visible to the administration team.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Customer not available, Incorrect address..."
              value={failureReason}
              onChangeText={setFailureReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowFailureModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtnSubmit} onPress={reportFailure}>
                <Text style={styles.modalBtnSubmitText}>Submit Report</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { color: colors.textSecondary, fontFamily: fonts.body },
  muted: { color: colors.textMuted, marginTop: 20, textAlign: "center", fontFamily: fonts.body },

  statusBanner: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 14, 
    borderRadius: layout.radius.md, 
    marginBottom: 20, 
    gap: 10 
  },
  statusText: { fontFamily: fonts.heading, fontSize: 16, textTransform: "uppercase", letterSpacing: 1 },

  card: { 
    backgroundColor: colors.surface, 
    borderRadius: layout.radius.lg, 
    padding: 20, 
    marginBottom: 20, 
    ...layout.shadows.md 
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16, opacity: 0.5 },

  infoGrid: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.heading, marginBottom: 4, letterSpacing: 0.5 },
  infoValue: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body },
  addressValue: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body, lineHeight: 22 },

  customerName: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  customerEmail: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.body, marginTop: 2 },
  pricePill: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: layout.radius.full },
  priceText: { color: colors.primary, fontFamily: fonts.heading, fontSize: 14 },

  productRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  productThumb: { width: 44, height: 44, borderRadius: layout.radius.sm, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  productImg: { width: "100%", height: "100%", borderRadius: layout.radius.sm },
  productName: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.heading },
  productMeta: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },

  claimBtn: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: layout.radius.md, alignItems: "center", marginBottom: 20, ...layout.shadows.md },
  claimBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  claimBtnText: { color: "#FFF", fontFamily: fonts.heading, fontSize: 16 },

  statusGroup: { flexDirection: "row", gap: 10, marginTop: 12 },
  statusPill: { flex: 1, paddingVertical: 12, borderRadius: layout.radius.md, backgroundColor: colors.surfaceAlt, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statusPillText: { color: colors.textSecondary, fontFamily: fonts.heading, fontSize: 13 },

  uploadHint: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body, marginBottom: 16 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: layout.radius.md, borderStyle: "dashed", borderWidth: 2, borderColor: colors.border },
  uploadBtnText: { color: colors.textMuted, fontFamily: fonts.heading, fontSize: 14 },
  btnDisabled: { opacity: 0.4 },
  deleteBtn: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: layout.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: -4,
    marginBottom: 20,
  },
  deleteBtnText: { color: "#FFFFFF", fontFamily: fonts.heading, fontSize: 14 },

  proofContainer: { marginTop: 16, borderRadius: layout.radius.lg, overflow: "hidden", ...layout.shadows.sm },
  proofImg: { width: "100%", height: 300, resizeMode: "cover", backgroundColor: colors.surfaceAlt },
  imageCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: layout.radius.lg,
    overflow: "hidden",
    marginTop: 10,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noProofBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: layout.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  noProofText: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  failureValue: { color: colors.danger, fontSize: 14, fontFamily: fonts.body, lineHeight: 20, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: layout.radius.sm, marginTop: 4 },
  failBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  failBtnText: { color: colors.danger, fontFamily: fonts.heading, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: colors.surface, padding: 24, borderRadius: layout.radius.lg, width: "100%", maxWidth: 400, ...layout.shadows.lg },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.textPrimary },
  modalDescription: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  reasonInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: layout.radius.md,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: layout.radius.md },
  modalBtnCancelText: { color: colors.textSecondary, fontFamily: fonts.heading, fontSize: 14 },
  modalBtnSubmit: { backgroundColor: colors.danger, paddingVertical: 10, paddingHorizontal: 16, borderRadius: layout.radius.md },
  modalBtnSubmitText: { color: colors.surface, fontFamily: fonts.heading, fontSize: 14 },
});
