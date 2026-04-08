import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { colors, fonts, layout } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const STATUS_THEME = {
  Pending: { color: colors.accent, soft: colors.accentSoft },
  InTransit: { color: colors.primary, soft: colors.primarySoft },
  Delivered: { color: colors.success, soft: colors.successSoft },
  Failed: { color: colors.danger, soft: colors.dangerSoft },
};

export function AdminDeliveriesScreen({ navigation }) {
  const { api, user } = useContext(AuthContext);
  const [deliveries, setDeliveries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const myUserId = user?._id || user?.id;

  async function load() {
    const res = await api.get("/deliveries");
    setDeliveries(res.data);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "delivery" && user?.role !== "driver") return;
    const unsub = navigation.addListener("focus", () => {
      load().catch((e) => Alert.alert("Error", e?.response?.data?.message || e.message));
    });
    return unsub;
  }, [navigation, user?.role]);

  if (user?.role !== "admin" && user?.role !== "delivery" && user?.role !== "driver") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Deliveries</Text>
        <Text style={styles.muted}>Access denied. Please contact support.</Text>
      </View>
    );
  }

  function getOrderSummary(delivery) {
    const order = delivery.orderId;
    if (!order) return { itemCount: 0, total: 0, customerName: "Unknown Customer" };
    const itemCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
    const customerName = order.userId?.name || "Customer";
    return { itemCount, total: order.totalAmount || 0, customerName };
  }

  const isOperator = user?.role === "driver" || user?.role === "delivery";


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {isOperator ? "My Assignments" : "All Deliveries"}
          </Text>
          <Text style={styles.subtitle}>
            {deliveries.length} tasks recorded
          </Text>
        </View>
        <Pressable
          style={styles.profileBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.profileAvatar}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(d) => d._id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No Deliveries Found</Text>
            <Text style={styles.emptySubtext}>New assignments will appear here once orders are processed.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const { itemCount, total, customerName } = getOrderSummary(item);
          const assignedDriverId = item.driverId?._id || item.driverId;
          const isAssignedToMe = Boolean(assignedDriverId && myUserId && String(assignedDriverId) === String(myUserId));
          const isUnassigned = !item.driverId;
          const theme = STATUS_THEME[item.status] || { color: colors.textSecondary, soft: colors.surfaceAlt };

          return (
            <View style={styles.card}>
              <View style={[styles.statusBar, { backgroundColor: theme.color }]} />

              <Pressable
                style={({ pressed }) => [styles.cardContent, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate("AdminDeliveryManage", { id: item._id })}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackingNum}>#{item.trackingNumber || "PENDING"}</Text>
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.soft }]}>
                    <Text style={[styles.statusText, { color: theme.color }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoPill}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.orderDetail}>{customerName}</Text>
                  </View>
                  <View style={styles.infoPill}>
                    <Ionicons name="basket-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.orderDetail}>{itemCount} item{itemCount !== 1 ? "s" : ""}</Text>
                  </View>
                  <Text style={styles.orderAmount}>LKR {Number(total).toFixed(2)}</Text>
                </View>

                <View style={styles.assignmentRow}>
                  {isAssignedToMe ? (
                    <View style={styles.assignedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.assignedText}>Assigned to you</Text>
                    </View>
                  ) : isUnassigned ? (
                    <View style={styles.unassignedBadge}>
                      <Ionicons name="alert-circle-outline" size={14} color={colors.primary} />
                      <Text style={styles.unassignedText}>Available to claim</Text>
                    </View>
                  ) : (
                    <View style={styles.otherBadge}>
                      <Text style={styles.otherText}>Assigned to {item.driverId?.name || "another partner"}</Text>
                    </View>
                  )}
                  <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                {item.status === "Failed" && item.failureReason ? (
                  <View style={styles.failureReasonRow}>
                    <Ionicons name="warning-outline" size={13} color={colors.danger} />
                    <Text style={styles.failureReasonText} numberOfLines={2}>
                      {item.failureReason}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 24 
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: layout.radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...layout.shadows.sm,
  },
  profileAvatar: { color: colors.surface, fontSize: 17, fontFamily: fonts.heading },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: fonts.heading, letterSpacing: -0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 2, fontFamily: fonts.body },
  muted: { color: colors.textMuted, textAlign: "center", marginTop: 40, fontFamily: fonts.body },

  emptyBox: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyText: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  emptySubtext: { color: colors.textSecondary, textAlign: "center", paddingHorizontal: 40, fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.lg,
    marginBottom: 16,
    ...layout.shadows.md,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  statusBar: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  trackingNum: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 15 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardAddress: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: layout.radius.sm },
  statusText: { fontFamily: fonts.heading, fontSize: 11, textTransform: "uppercase" },

  orderInfo: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: layout.radius.full },
  orderDetail: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.body },
  orderAmount: { color: colors.primary, fontFamily: fonts.heading, fontSize: 14, marginLeft: "auto" },

  assignmentRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginTop: 8 
  },
  assignedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.successSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: layout.radius.sm },
  assignedText: { color: colors.success, fontFamily: fonts.heading, fontSize: 11 },
  unassignedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: layout.radius.sm },
  unassignedText: { color: colors.primary, fontFamily: fonts.heading, fontSize: 11 },
  otherBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: layout.radius.sm },
  otherText: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 },
  cardDate: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.body },
  failureReasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: layout.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  failureReasonText: { color: colors.danger, fontSize: 11, fontFamily: fonts.body, flex: 1, lineHeight: 16 },
});
