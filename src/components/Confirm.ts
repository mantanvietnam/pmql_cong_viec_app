import {Alert} from 'react-native';

export const confirm = (title: string, message: string, onConfirm: () => void) => {
  Alert.alert(title, message, [
    {text: 'Huy', style: 'cancel'},
    {text: 'Dong y', style: 'destructive', onPress: onConfirm},
  ]);
};
