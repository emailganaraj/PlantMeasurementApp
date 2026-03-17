/**
 * Analysis Metadata Modal
 * Collects analysis name, seed counts, and calculates germination %
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface AnalysisMetadata {
  name: string;
  totalSeedsKept: number;
  totalSeedsGerminated: number;
  germinationPercentage: number;
}

interface AnalysisMetadataModalProps {
  visible: boolean;
  onSubmit: (metadata: AnalysisMetadata) => void;
  onCancel: () => void;
}

export const AnalysisMetadataModal: React.FC<AnalysisMetadataModalProps> = ({
  visible,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [totalSeedsKept, setTotalSeedsKept] = useState('');
  const [totalSeedsGerminated, setTotalSeedsGerminated] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an analysis name');
      return;
    }

    const kept = parseInt(totalSeedsKept, 10);
    const germinated = parseInt(totalSeedsGerminated, 10);

    if (isNaN(kept) || kept <= 0) {
      Alert.alert('Error', 'Please enter valid total seeds kept for germination');
      return;
    }

    if (isNaN(germinated) || germinated < 0) {
      Alert.alert('Error', 'Please enter valid total seeds germinated');
      return;
    }

    if (germinated > kept) {
      Alert.alert('Error', 'Seeds germinated cannot be more than seeds kept');
      return;
    }

    const germinationPercentage = (germinated / kept) * 100;

    onSubmit({
      name: name.trim(),
      totalSeedsKept: kept,
      totalSeedsGerminated: germinated,
      germinationPercentage: parseFloat(germinationPercentage.toFixed(2)),
    });

    // Reset form
    setName('');
    setTotalSeedsKept('');
    setTotalSeedsGerminated('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>📊 Analysis Details</Text>
            <Text style={styles.subtitle}>
              Name this analysis and provide seed germination data
            </Text>

            {/* Analysis Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Analysis Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Seed Name - Batch A - Week 1"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Total Seeds Kept */}
            <View style={styles.section}>
              <Text style={styles.label}>Total Seeds Kept for Germination</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 100"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={totalSeedsKept}
                onChangeText={setTotalSeedsKept}
              />
            </View>

            {/* Total Seeds Germinated */}
            <View style={styles.section}>
              <Text style={styles.label}>Total Seeds Germinated</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 85"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={totalSeedsGerminated}
                onChangeText={setTotalSeedsGerminated}
              />
            </View>

            {/* Calculate Germination % */}
            {totalSeedsKept && totalSeedsGerminated && (
              <View style={styles.calculationBox}>
                <Text style={styles.calcLabel}>Calculated Germination %:</Text>
                <Text style={styles.calcValue}>
                  {(
                    (parseInt(totalSeedsGerminated, 10) /
                      parseInt(totalSeedsKept, 10)) *
                    100
                  ).toFixed(2)}
                  %
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16a34a',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  calculationBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  calcLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  calcValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16a34a',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#16a34a',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
