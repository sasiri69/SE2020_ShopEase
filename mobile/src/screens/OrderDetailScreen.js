import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { resolveImageUrl } from "../utils/imageUrl";
import { colors } from "../theme";

export function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { api, user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [myReviews, setMyReviews] = useState([]);

  async function load() {
    const res = await api.get(`/orders/${id}`);
    setOrder(res.data);
    const revs = await api.get(`/reviews/user`);
    setMyReviews(revs.data);
  }

  useEffect(() => {
    load().catch((e) => Alert.alert("Error", e?.response?.data?.message || e.message));
  }, [id]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Order</Text>
      <Text style={styles.meta}>Status: {order.status}</Text>
      <Text style={styles.meta}>Total: LKR {Number(order.totalAmount).toFixed(2)}</Text>

      {order.paymentId?.receiptImage ? (
        <>
          <Text style={styles.section}>Payment Receipt</Text>
          <View style={styles.imageCard}>
            <Image source={{ uri: resolveImageUrl(order.paymentId.receiptImage) }} style={styles.previewImg} />
          </View>
        </>
      ) : null}

      {order.paymentId?.codProofImage ? (
        <>
          <Text style={styles.section}>Order Confirm Proof</Text>
          <View style={styles.imageCard}>
            <Image source={{ uri: resolveImageUrl(order.paymentId.codProofImage) }} style={styles.previewImg} />
          </View>
        </>
      ) : null}

      {order.cartProofImage && user?.role === "admin" ? (
        <>
          <Text style={styles.section}>Cart Proof Image</Text>
          <View style={styles.imageCard}>
            <Image source={{ uri: resolveImageUrl(order.cartProofImage) }} style={styles.previewImg} />
          </View>
        </>
      ) : null}

      {order.deliveryId?.proofImage ? (
        <>
          <Text style={styles.section}>Delivery Proof</Text>
          <View style={styles.imageCard}>
            <Image source={{ uri: resolveImageUrl(order.deliveryId.proofImage) }} style={styles.previewImg} />
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        {order.deliveryId?._id ? (
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("DeliveryDetail", { id: order.deliveryId._id })}>
            <Text style={styles.actionText}>Delivery</Text>
          </Pressable>
        ) : null}
        {user?.role === "admin" && order.status === "Pending" ? (
          <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
            {order.paymentId?.status === "Pending" && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
                onPress={async () => {
                  try {
                    await api.put(`/payments/${order.paymentId._id}/verify`, { status: "Verified" });
                    Alert.alert("Approved", "Payment has been verified successfully.");
                    await load();
                  } catch (e) {
                    Alert.alert("Error", e?.response?.data?.message || e.message);
                  }
                }}
              >
                <Text style={[styles.actionText, { color: "#FFF" }]}>Approve</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionBtn, styles.danger]}
              onPress={() => {
                Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
                  { text: "No", style: "cancel" },
                  {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await api.delete(`/orders/${order._id}`);
                        Alert.alert("Cancelled", "Order has been cancelled.", [
                          { text: "OK", onPress: () => navigation.goBack() }
                        ]);
                      } catch (e) {
                        Alert.alert("Error", e?.response?.data?.message || e.message);
                      }
                    }
                  }
                ]);
              }}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.section}>Items</Text>
      {order.items?.map((it, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.thumb}>
            {resolveImageUrl(it.productId?.images?.[0]) ? (
              <Image source={{ uri: resolveImageUrl(it.productId?.images?.[0]) }} style={styles.thumbImg} />
            ) : (
              <View style={styles.thumbPlaceholder} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {it.productId?.name || "Product"}
            </Text>
            <Text style={styles.meta}>Qty {it.quantity}</Text>
            <Text style={styles.price}>LKR {Number(it.priceAtTime).toFixed(2)}</Text>
          </View>
          {order.status === "Delivered" && it.productId?._id && user?.role !== "admin" ? (() => {
            const existingReview = myReviews.find(r => String(r.productId) === String(it.productId._id) && String(r.orderId) === String(order._id));
            
            if (existingReview) {
              return (
                <View style={{ gap: 8 }}>
                  <Pressable
                    style={styles.reviewBtn}
                    onPress={() => navigation.navigate("ReviewCreate", { reviewToEdit: existingReview })}
                  >
                    <Text style={styles.reviewText}>Edit Review</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.reviewBtn, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
                    onPress={() => {
                      Alert.alert("Delete Review", "Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: async () => {
                          try {
                            await api.delete(`/reviews/${existingReview._id}`);
                            setMyReviews(prev => prev.filter(r => r._id !== existingReview._id));
                            Alert.alert("Deleted", "Review has been removed.");
                          } catch (e) {
                            Alert.alert("Error", e?.response?.data?.message || e.message);
                          }
                        }}
                      ]);
                    }}
                  >
                    <Text style={[styles.reviewText, { color: colors.danger }]}>Delete Review</Text>
                  </Pressable>
                </View>
              );
            }

            return (
              <Pressable
                style={styles.reviewBtn}
                onPress={() => navigation.navigate("ReviewCreate", { productId: it.productId._id, orderId: order._id })}
              >
                <Text style={styles.reviewText}>Review</Text>
              </Pressable>
            );
          })() : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  loadingText: { color: colors.textSecondary },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: "900" },
  meta: { color: colors.textSecondary, marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, backgroundColor: colors.surface, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  actionText: { color: colors.textPrimary, fontWeight: "900" },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", marginTop: 18, marginBottom: 10 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: "center",
  },
  thumb: { width: 54, height: 54, borderRadius: 16, overflow: "hidden", backgroundColor: colors.accentSoft },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: { flex: 1, backgroundColor: colors.accentSoft },
  name: { color: colors.textPrimary, fontWeight: "900" },
  price: { color: colors.accent, marginTop: 8, fontWeight: "900" },
  reviewBtn: { backgroundColor: colors.accentSoft, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  reviewText: { color: colors.accent, fontWeight: "900" },
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 14,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

