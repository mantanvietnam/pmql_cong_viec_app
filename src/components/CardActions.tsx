import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {GestureResponderEvent} from 'react-native';
import {BarChart3, Edit3, Trash2} from 'lucide-react-native';
import {colors} from '../theme/colors';

type Props = {
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  reportLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
};

export function CardActions({
  onReport,
  onEdit,
  onDelete,
  reportLabel = 'Báo cáo',
  editLabel = 'Chỉnh sửa',
  deleteLabel = 'Xóa',
}: Props) {
  if (!onReport && !onEdit && !onDelete) return null;

  const press = (event: GestureResponderEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };

  return (
    <View style={styles.container}>
      {onReport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reportLabel}
          style={[styles.button, styles.reportButton]}
          onPress={event => press(event, onReport)}>
          <BarChart3 size={17} color={colors.success} />
          <Text style={[styles.label, styles.reportLabel]}>{reportLabel}</Text>
        </Pressable>
      ) : null}
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          style={[styles.button, styles.editButton]}
          onPress={event => press(event, onEdit)}>
          <Edit3 size={17} color={colors.primary} />
          <Text style={[styles.label, styles.editLabel]}>{editLabel}</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          style={[styles.button, styles.deleteButton]}
          onPress={event => press(event, onDelete)}>
          <Trash2 size={17} color={colors.danger} />
          <Text style={[styles.label, styles.deleteLabel]}>{deleteLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  reportButton: {backgroundColor: '#ecfdf5', borderColor: '#a7f3d0'},
  editButton: {backgroundColor: '#eff6ff', borderColor: '#bfdbfe'},
  deleteButton: {backgroundColor: '#fff1f2', borderColor: '#fecdd3'},
  label: {fontSize: 13, fontWeight: '800'},
  reportLabel: {color: colors.success},
  editLabel: {color: colors.primary},
  deleteLabel: {color: colors.danger},
});
