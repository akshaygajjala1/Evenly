import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import ReceiptCard from "../components/ReceiptCard";
import { getParticipantDisplay, useAppStore } from "../store/AppStore";

export default function HomeScreen() {
  const router = useRouter();
  const { state } = useAppStore();

  const currentUserId = state.currentUser.id;
  const pendingBills = state.bills.filter((b) => b.status === "pending");
  const billsForMe = pendingBills.filter((b) => b.recipientId === currentUserId || b.senderId === currentUserId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Evenly</Text>
          <Text style={styles.subtitle}>Split receipts. Send requests. Pay bills.</Text>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickCard} onPress={() => router.push("/add-friend")}>
            <Text style={styles.quickTitle}>+ Add friend</Text>
            <Text style={styles.quickSubtitle}>Phone or user ID</Text>
          </Pressable>
          <Pressable style={styles.quickCardPrimary} onPress={() => router.push("/scan")}>
            <Text style={styles.quickTitlePrimary}>+ New split</Text>
            <Text style={styles.quickSubtitlePrimary}>Scan a receipt</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <Pressable onPress={() => router.push("/add-friend")}>
              <Text style={styles.sectionLink}>Add</Text>
            </Pressable>
          </View>

          {state.friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>Add a friend to split a receipt.</Text>
            </View>
          ) : (
            <View style={styles.friendsWrap}>
              {state.friends.slice(0, 10).map((f) => (
                <View key={f.id} style={[styles.friendChip, { borderColor: f.color }]}>
                  <View style={[styles.friendDot, { backgroundColor: f.color }]} />
                  <View>
                    <Text style={styles.friendName}>{f.name}</Text>
                    {!!f.phone && <Text style={styles.friendMeta}>{f.phone}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current bills</Text>
            <Text style={styles.sectionMeta}>{billsForMe.length} pending</Text>
          </View>

          {billsForMe.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No bills yet</Text>
              <Text style={styles.emptySubtitle}>Create a split to generate requests.</Text>
            </View>
          ) : (
            billsForMe.slice(0, 6).map((b) => {
              const receipt = state.receipts.find((r) => r.id === b.receiptId);
              const sender = getParticipantDisplay(state, b.senderId);
              const recipient = getParticipantDisplay(state, b.recipientId);
              const youOwe = b.recipientId === currentUserId;
              const title = receipt?.title || "Split";
              const subtitle = youOwe ? `You owe ${sender.name}` : `${recipient.name} owes you`;

              return (
                <Pressable
                  key={b.id}
                  style={styles.billCard}
                  onPress={() => {
                    if (youOwe) {
                      router.push({ pathname: "/pay", params: { billId: b.id } });
                    } else {
                      router.push({ pathname: "/receipt-details", params: { receiptId: b.receiptId } });
                    }
                  }}
                >
                  <View style={styles.billHeader}>
                    <Text style={styles.billTitle}>{title}</Text>
                    <Text style={styles.billAmount}>${b.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.billFooter}>
                    <Text style={styles.billFrom}>{subtitle}</Text>
                    <Text style={styles.billDate}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Receipts</Text>
            <Text style={styles.sectionMeta}>{state.receipts.length}</Text>
          </View>

          {state.receipts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No receipts yet</Text>
              <Text style={styles.emptySubtitle}>Tap “New split” to scan your first receipt.</Text>
            </View>
          ) : (
            state.receipts.slice(0, 10).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: "/receipt-details", params: { receiptId: r.id } })}
                style={{ marginBottom: 12 }}
              >
                <ReceiptCard
                  title={r.title}
                  total={`$${r.receipt.total.toFixed(2)}`}
                  date={new Date(r.createdAt).toLocaleDateString()}
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  scroll: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 14 },
  title: { fontSize: 28, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, color: "#6b7280" },
  quickRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  quickCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  quickCardPrimary: { flex: 1, backgroundColor: "#111827", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#111827" },
  quickTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  quickSubtitle: { marginTop: 6, color: "#6b7280" },
  quickTitlePrimary: { fontSize: 16, fontWeight: "900", color: "#fff" },
  quickSubtitlePrimary: { marginTop: 6, color: "rgba(255,255,255,0.75)" },
  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  sectionMeta: { color: "#6b7280", fontWeight: "800" },
  sectionLink: { color: "#111827", fontWeight: "900" },
  billCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  billHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billTitle: { fontSize: 15, fontWeight: "900", color: "#111827", flex: 1, paddingRight: 10 },
  billAmount: { fontSize: 16, fontWeight: "900", color: "#111827" },
  billFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  billFrom: { fontSize: 13, color: "#6b7280" },
  billDate: { fontSize: 13, color: "#6b7280" },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  emptyTitle: { fontWeight: "900", color: "#111827" },
  emptySubtitle: { marginTop: 6, color: "#6b7280" },
  friendsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  friendChip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1 },
  friendDot: { width: 10, height: 10, borderRadius: 5 },
  friendName: { fontWeight: "900", color: "#111827" },
  friendMeta: { marginTop: 2, color: "#6b7280", fontSize: 12 }
});
