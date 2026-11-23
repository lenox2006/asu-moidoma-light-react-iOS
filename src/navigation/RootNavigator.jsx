import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Icon, ScreenBoundary } from '../components/ui';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import { useAuth } from '../lib/auth';
import HouseCardScreen from '../screens/HouseCardScreen';
import HousesScreen from '../screens/HousesScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserEditScreen from '../screens/UserEditScreen';
import UsersScreen from '../screens/UsersScreen';
import { useTheme, fs } from '../theme';

const Tab = createBottomTabNavigator();
const HousesStack = createNativeStackNavigator();
const UsersStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

/* Стек «Дома»: один экран списка, который push-ится на каждый уровень, и карточка. */
function HousesNav() {
  return (
    <HousesStack.Navigator screenOptions={{ headerShown: false }}>
      <HousesStack.Screen name="Houses" component={HousesScreen} />
      <HousesStack.Screen name="HouseCard" component={HouseCardScreen} />
    </HousesStack.Navigator>
  );
}
function UsersNav() {
  return (
    <UsersStack.Navigator screenOptions={{ headerShown: false }}>
      <UsersStack.Screen name="Users" component={UsersScreen} />
      <UsersStack.Screen name="UserEdit" component={UserEditScreen} />
    </UsersStack.Navigator>
  );
}

/* Экран аналитики под защитой: ошибка отрисовки покажется карточкой, а не закроет приложение. */
function AnalyticsNav() {
  return <ScreenBoundary><AnalyticsScreen /></ScreenBoundary>;
}

function Tabs() {
  const { isSuperadmin } = useAuth();
  const { theme: t } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: t.colors.accent,
      tabBarInactiveTintColor: t.colors.textMuted,
      tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.line },
      tabBarLabelStyle: { fontSize: fs(t.size.tab), fontWeight: '500' },
      tabBarIcon: ({ color }) => ({ HousesTab: Icon.home, AnalyticsTab: Icon.chart, UsersTab: Icon.users, ProfileTab: Icon.person }[route.name](color)),
    })}>
      <Tab.Screen name="HousesTab" component={HousesNav} options={{ title: 'Дома' }} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsNav} options={{ title: 'Аналитика' }} />
      {isSuperadmin ? <Tab.Screen name="UsersTab" component={UsersNav} options={{ title: 'Пользователи' }} /> : null}
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme: t } = useTheme();
  const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: t.colors.accent, background: t.colors.bg, card: t.colors.surface, text: t.colors.text, border: t.colors.line } };
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg }}><ActivityIndicator color={t.colors.accent} /></View>;
  return (
    <NavigationContainer theme={navTheme}>
      {user ? <Tabs /> : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}><AuthStack.Screen name="Login" component={LoginScreen} /></AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
