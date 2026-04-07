import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ProductListScreen } from "../screens/ProductListScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { CartScreen } from "../screens/CartScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { DeliveryDetailScreen } from "../screens/DeliveryDetailScreen";
import { ReviewCreateScreen } from "../screens/ReviewCreateScreen";
import { AdminProductFormScreen } from "../screens/AdminProductFormScreen";
import { AdminDeliveriesScreen } from "../screens/AdminDeliveriesScreen";
import { AdminDeliveryManageScreen } from "../screens/AdminDeliveryManageScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TeamScreen } from "../screens/TeamScreen";
import { SavedCardsScreen } from "../screens/SavedCardsScreen";
import { colors, fonts } from "../theme";

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { token, loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1220" }}>
        <Text style={{ color: "#FFFFFF" }}>Loading...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // Driver/Delivery users should only access delivery workflow screens.
  if (user?.role === "delivery" || user?.role === "driver") {
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18 },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="AdminDeliveries" 
          component={AdminDeliveriesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminDeliveryManage" 
          component={AdminDeliveryManageScreen} 
          options={{ title: "Task Details" }} 
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile Settings" }}
        />
        <Stack.Screen
          name="Team"
          component={TeamScreen}
          options={{ title: "About Team" }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Products" component={ProductListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order Details" }} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: "Delivery Status" }} />
      <Stack.Screen name="ReviewCreate" component={ReviewCreateScreen} options={{ title: "Write Review" }} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} options={{ title: "Product Management" }} />
      <Stack.Screen name="AdminDeliveries" component={AdminDeliveriesScreen} options={{ title: "Deliveries" }} />
      <Stack.Screen name="AdminDeliveryManage" component={AdminDeliveryManageScreen} options={{ title: "Manage Delivery" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile Settings" }} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Team" component={TeamScreen} options={{ title: "About Team" }} />
    </Stack.Navigator>
  );
}

