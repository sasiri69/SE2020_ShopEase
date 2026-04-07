import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { APP_INFO } from "../appInfo";
import { colors, fonts } from "../theme";

export function TeamScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>{APP_INFO.appName}</Text>
      <Text style={styles.subtitle}>{APP_INFO.course}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Submission details</Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Group Number: </Text>
          <Text style={styles.value}>{APP_INFO.groupNumber}</Text>
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>GitHub Repository: </Text>
          <Text style={styles.value}>{APP_INFO.githubRepoUrl}</Text>
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Backend URL: </Text>
          <Text style={styles.value}>{APP_INFO.backendUrl}</Text>
        </Text>
      </View>

      <Text style={styles.section}>Team responsibility breakdown</Text>
      {APP_INFO.team.map((m) => (
        <View key={m.studentId} style={styles.member}>
          <Text style={styles.memberTitle}>
            Member {m.memberNo}: {m.studentId} — {m.name}
          </Text>
          <Text style={styles.memberLine}>
            <Text style={styles.label}>Module: </Text>
            <Text style={styles.value}>{m.module}</Text>
          </Text>
          <Text style={styles.memberLine}>
            <Text style={styles.label}>Main Entity: </Text>
            <Text style={styles.value}>{m.entity}</Text>
          </Text>
          <Text style={styles.memberLine}>
            <Text style={styles.label}>Image responsibility: </Text>
            <Text style={styles.value}>{m.imageResponsibility}</Text>
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: fonts.heading },
  subtitle: { color: colors.textSecondary, marginTop: 6, fontFamily: fonts.body, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { color: colors.textPrimary, fontFamily: fonts.heading, marginBottom: 10 },
  row: { color: colors.textSecondary, marginTop: 6, fontFamily: fonts.body },
  label: { color: colors.textSecondary, fontFamily: fonts.body },
  value: { color: colors.textPrimary, fontFamily: fonts.body },
  section: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading, marginTop: 6, marginBottom: 10 },
  member: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  memberTitle: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 14 },
  memberLine: { color: colors.textSecondary, marginTop: 6, fontFamily: fonts.body, lineHeight: 20 },
});

