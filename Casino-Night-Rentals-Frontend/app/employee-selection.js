import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function EmployeeSelection() {
  const router = useRouter();

  const employees = [
    { name: "Finance", route: "/finance-login", icon: "attach-money" },
    { name: "Event Manager", route: "/event-manager-login", icon: "event" },
    { name: "Service Manager", route: "/service-manager-login", icon: "miscellaneous-services" },
    { name: "Dealers/Croupiers", route: "/dealer-login", icon: "casino" },
    { name: "Storekeeper", route: "/storekeeper-login", icon: "inventory" },
    { name: "Supplier", route: "/supplier-login", icon: "local-shipping" }
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Employee Portal</Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
        </View>

        <View style={styles.buttonsContainer}>
          {employees.map((employee, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.button} 
              onPress={() => router.push(employee.route)}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <MaterialIcons name={employee.icon} size={24} color="#fff" />
                <Text style={styles.buttonText}>{employee.name}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a365d",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#2c5282",
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
});