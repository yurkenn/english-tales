import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { useDispatch, useSelector } from 'react-redux';
import { changeFontSize } from '../../store/slices/fontSizeSlice';
import { wp, hp, scale, fontSizes, spacing } from '../../utils/dimensions';
import BottomSheet from '@gorhom/bottom-sheet';

const FONT_SIZES = [
  { label: 'Small', size: 14 },
  { label: 'Medium', size: 16 },
  { label: 'Large', size: 18 },
  { label: 'Extra Large', size: 20 },
];

const FontSettingsModal = ({ visible, onClose }) => {
  const bottomSheetRef = useRef(null);
  const dispatch = useDispatch();
  const currentFontSize = useSelector((state) => state.fontSize.fontSize);

  const handleSelectSize = (size) => {
    dispatch(changeFontSize(size));
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={['60%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: Colors.dark800 }}
      handleIndicatorStyle={{ backgroundColor: Colors.gray500 }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Text Size</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={scale(24)} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {FONT_SIZES.map((option) => (
            <TouchableOpacity
              key={option.size}
              style={[styles.sizeOption, currentFontSize === option.size && styles.selectedOption]}
              onPress={() => handleSelectSize(option.size)}
            >
              <Text
                style={[
                  styles.sampleText,
                  { fontSize: option.size },
                  currentFontSize === option.size && styles.selectedText,
                ]}
              >
                {option.label}
              </Text>
              {currentFontSize === option.size && (
                <Icon name="checkmark" size={scale(20)} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewBox}>
            <Text style={[styles.previewText, { fontSize: currentFontSize }]}>
              The quick brown fox jumps over the lazy dog.
            </Text>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    paddingTop: hp(2),
    paddingBottom: hp(4),
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    padding: wp(2),
  },
  content: {
    paddingHorizontal: wp(4),
  },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
    borderRadius: scale(12),
    backgroundColor: Colors.dark900 + '40',
  },
  selectedOption: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  sampleText: {
    color: Colors.gray300,
    fontWeight: '500',
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: hp(3),
    paddingHorizontal: wp(4),
  },
  previewLabel: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    marginBottom: hp(1),
  },
  previewBox: {
    padding: wp(4),
    backgroundColor: Colors.dark900 + '80',
    borderRadius: scale(12),
  },
  previewText: {
    color: Colors.white,
    lineHeight: scale(28),
  },
});

export default FontSettingsModal;
