import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Image } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { resolveImageUrl } from "../utils/imageUrl";
import { colors, fonts } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export function OrdersScreen({ navigation }) {
  const { api, user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  async function load() {
    const res = await api.get("/orders");
    setOrders(res.data);
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      load().catch((e) => Alert.alert("Error", e?.response?.data?.message || e.message));
    });
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.role === "admin" ? "All Orders" : "My Orders"}</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ hovered, pressed }) => [
              styles.card,
              (hovered || pressed) && styles.cardHover,
            ]}
            onPress={() => navigation.navigate("OrderDetail", { id: item._id })}
          >
            <View style={styles.thumb}>
              {resolveImageUrl(item.items?.[0]?.productId?.images?.[0]) ? (
                <Image source={{ uri: resolveImageUrl(item.items?.[0]?.productId?.images?.[0]) }} style={styles.thumbImg} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                Order {String(item._id).slice(-6).toUpperCase()}
              </Text>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
              {user?.role === "admin" ? (
                <Text style={styles.meta}>
                  {item.userId?.name || "Customer"} {item.userId?.email ? `• ${item.userId.email}` : ""}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.price}>LKR {Number(item.totalAmount).toFixed(2)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.textPrimary, fontSize: 26, marginBottom: 10, fontFamily: fonts.heading },
  muted: { color: colors.textMuted },
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
  },
  cardHover: {
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "hsl(210, 20%, 96%)", // surfaceAlt fallback
  },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  name: { color: colors.textPrimary, fontFamily: fonts.heading },
  meta: { color: colors.textSecondary, marginTop: 4, fontFamily: fonts.body },
  status: { color: colors.textSecondary, fontFamily: fonts.body },
  price: { color: colors.accent, marginTop: 6, fontFamily: fonts.button },
});

