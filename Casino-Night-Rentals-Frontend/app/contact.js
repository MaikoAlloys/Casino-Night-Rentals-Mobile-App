import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function Contact() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Get In Touch</Text>
                <Text style={styles.subtitle}>We'd love to hear from you</Text>
            </View>

            <View style={styles.contactCard}>
                <View style={styles.contactItem}>
                    <MaterialIcons name="business" size={24} color="#3182CE" />
                    <View style={styles.contactTextContainer}>
                        <Text style={styles.label}>Company Name</Text>
                        <Text style={styles.info}>Casino Night Rentals</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.contactItem}>
                    <MaterialIcons name="phone" size={24} color="#3182CE" />
                    <View style={styles.contactTextContainer}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.info}>+254 723 456 789</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.contactItem}>
                    <MaterialIcons name="email" size={24} color="#3182CE" />
                    <View style={styles.contactTextContainer}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.info}>support@casinonightrentals.com</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.contactItem}>
                    <MaterialIcons name="location-on" size={24} color="#3182CE" />
                    <View style={styles.contactTextContainer}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.info}>123 Casino Ave, Nairobi, Kenya</Text>
                    </View>
                </View>
            </View>

            <View style={styles.hoursContainer}>
                <Text style={styles.hoursTitle}>Business Hours</Text>
                <Text style={styles.hoursText}>Monday - Friday: 9:00 AM - 6:00 PM</Text>
                <Text style={styles.hoursText}>Saturday: 10:00 AM - 4:00 PM</Text>
                <Text style={styles.hoursText}>Sunday: Closed</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#F8FAFC",
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A365D",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#718096",
    },
    contactCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 24,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    contactTextContainer: {
        marginLeft: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4A5568",
        marginBottom: 4,
    },
    info: {
        fontSize: 16,
        color: "#2D3748",
    },
    separator: {
        height: 1,
        backgroundColor: "#EDF2F7",
        marginVertical: 4,
    },
    hoursContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    hoursTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1A365D",
        marginBottom: 12,
    },
    hoursText: {
        fontSize: 16,
        color: "#4A5568",
        marginBottom: 8,
    },
});