import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';

export default function CustomDrawerContent(props: any) {
  const { bottom } = useSafeAreaInsets();
  const navigation = useNavigation();

  const closeDrawer = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 0 }}>
        {/* Example: List of items */}
        <DrawerItemList {...props} />

        {/* Logout button */}
        <Pressable
          onPress={closeDrawer}
          style={{ paddingVertical: 15, paddingHorizontal: 10, marginTop: 20 }}
        >
          <Text style={{ color: 'red', fontWeight: 'bold' }}>Logout</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}
