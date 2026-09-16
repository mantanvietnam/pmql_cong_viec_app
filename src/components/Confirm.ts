import {Alert} from 'react-native';

export const confirm = (title: string, message: string, onConfirm: () => void) => {
  Alert.alert(title, message, [
    {text: 'Hủy', style: 'cancel'},
    {text: 'Đồng ý', style: 'destructive', onPress: onConfirm},
  ]);
};
