import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Please select your role</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.customerButton]} 
          onPress={() => router.push("/customer-login")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Customer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.employeeButton]} 
          onPress={() => router.push("/employee-selection")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Employee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerButton: {
    backgroundColor: "#0066cc",
  },
  employeeButton: {
    backgroundColor: "#004d99",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});