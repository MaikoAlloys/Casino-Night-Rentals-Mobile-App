import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function About() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>About Casino Night Rentals</Text>
            </View>
            
            <View style={styles.contentCard}>
                <Text style={styles.paragraph}>
                    Casino Night Rentals is Kenya's premier provider of luxury casino-themed event rentals.
                    We bring the excitement of a real casino to your events, offering top-quality gaming tables,
                    professional dealers, and a premium experience tailored to your needs.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.subtitle}>Our Mission</Text>
                <View style={styles.divider} />
                <Text style={styles.paragraph}>
                    Our mission is to deliver unforgettable casino experiences for birthdays, corporate events,
                    weddings, and private parties. We ensure professionalism, quality, and customer satisfaction.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.subtitle}>Why Choose Us?</Text>
                <View style={styles.divider} />
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.paragraph}>High-quality casino equipment</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.paragraph}>Professional and friendly dealers</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.paragraph}>Customizable packages for different events</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.paragraph}>Affordable and transparent pricing</Text>
                </View>
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
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1a365d",
        textAlign: "center",
    },
    contentCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    section: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: "#e2e8f0",
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: "#4a5568",
        marginBottom: 12,
    },
    bulletPoint: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    bullet: {
        marginRight: 8,
        color: "#4a5568",
        fontSize: 16,
        lineHeight: 24,
    },
});