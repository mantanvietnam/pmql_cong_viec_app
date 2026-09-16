import React, {useEffect, useRef} from 'react';
import {FlatList, Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';

export type Segment<T extends string> = {value: T; label: string; count?: number};

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const hasCounts = items.some(item => typeof item.count === 'number');
  const listRef = useRef<FlatList<Segment<T>>>(null);

  useEffect(() => {
    const index = items.findIndex(item => item.value === value);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({index, animated: true, viewPosition: 0.5});
    });
    return () => cancelAnimationFrame(frame);
  }, [items, value]);

  return (
    <FlatList
      ref={listRef}
      style={[styles.list, hasCounts ? styles.countList : styles.compactList]}
      horizontal
      data={items}
      keyExtractor={item => item.value}
      showsHorizontalScrollIndicator={false}
      onScrollToIndexFailed={() => listRef.current?.scrollToEnd({animated: true})}
      contentContainerStyle={styles.content}
      renderItem={({item}) => {
        const active = item.value === value;
        return (
          <Pressable
            style={[styles.item, hasCounts ? styles.countItem : styles.compactItem, active && styles.active]}
            onPress={() => onChange(item.value)}>
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            {typeof item.count === 'number' ? (
              <Text style={[styles.count, active && styles.activeLabel]}>{item.count}</Text>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {flexGrow: 0},
  countList: {height: 88},
  compactList: {height: 62},
  content: {paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center'},
  item: {paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
  countItem: {height: 72, minWidth: 108, gap: 4},
  compactItem: {height: 44, minWidth: 96},
  active: {backgroundColor: colors.primary, borderColor: colors.primary},
  label: {fontSize: 13, fontWeight: '800', color: colors.muted, textAlign: 'center'},
  activeLabel: {color: '#fff'},
  count: {fontSize: 18, fontWeight: '900', color: colors.primary, textAlign: 'center'},
});
