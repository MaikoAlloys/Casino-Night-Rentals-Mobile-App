import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function Help() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Help & Support</Text>
                <Text style={styles.subtitle}>Frequently Asked Questions</Text>
            </View>

            <View style={styles.faqContainer}>
                <View style={styles.faqItem}>
                    <Text style={styles.question}>1. How do I rent a product?</Text>
                    <View style={styles.answerBox}>
                        <Text style={styles.answer}>Browse available products, select the one you want, and click "Rent Now."</Text>
                    </View>
                </View>

                <View style={styles.faqItem}>
                    <Text style={styles.question}>2. How do I make a payment?</Text>
                    <View style={styles.answerBox}>
                        <Text style={styles.answer}>You can pay via Mpesa or bank transfer. Follow the checkout process for details.</Text>
                    </View>
                </View>

                <View style={styles.faqItem}>
                    <Text style={styles.question}>3. How do I contact support?</Text>
                    <View style={styles.answerBox}>
                        <Text style={styles.answer}>You can reach us through the Contact Us page or email support@casinonightrentals.com.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.contactPrompt}>
                <Text style={styles.contactText}>Still need help? </Text>
                <Text style={styles.contactLink}>Contact our support team</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#f8f9fa",
    },
    header: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1a365d",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#4a5568",
    },
    faqContainer: {
        marginBottom: 24,
    },
    faqItem: {
        marginBottom: 20,
    },
    question: {
        fontSize: 18,
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: 8,
    },
    answerBox: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    answer: {
        fontSize: 16,
        lineHeight: 24,
        color: "#4a5568",
    },
    contactPrompt: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 16,
    },
    contactText: {
        fontSize: 16,
        color: "#4a5568",
    },
    contactLink: {
        fontSize: 16,
        color: "#3182ce",
        fontWeight: "600",
    },
});