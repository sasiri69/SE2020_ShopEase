import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Image, ScrollView } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { resolveImageUrl } from "../utils/imageUrl";
import { colors } from "../theme";

export function DeliveryDetailScreen({ route }) {
  const { id } = route.params;
  const { api } = useContext(AuthContext);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    api
      .get(`/deliveries/${id}`)
      .then((res) => setDelivery(res.data))
      .catch((e) => Alert.alert("Error", e?.response?.data?.message || e.message));
  }, [id]);

  if (!delivery) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Delivery</Text>
      <Text style={styles.meta}>Tracking: {delivery.trackingNumber || "-"}</Text>
      <Text style={styles.meta}>Status: {delivery.status}</Text>
      <Text style={styles.meta}>Address: {delivery.address}</Text>

      {delivery.proofImage ? (
        <>
          <Text style={styles.section}>Proof image</Text>
          <Image source={{ uri: resolveImageUrl(delivery.proofImage) }} style={styles.img} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  loading: { color: colors.textSecondary },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: "900" },
  meta: { color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", marginTop: 18, marginBottom: 10 },
  img: { width: "100%", height: 220, borderRadius: 16, backgroundColor: colors.accentSoft },
});

