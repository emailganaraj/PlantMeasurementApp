/**
 * ManualMeasurementModal.tsx
 *
 * Modal for submitting manual measurements for testing.
 * - Allows users to input number of plants
 * - Displays input rows for root and shoot measurements (cm)
 * - Calculates totals automatically
 * - Option to load previous manual measurements from dropdown
 * - Stores results in manual.json with recalculated SVI
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Picker,
} from 'react-native';

interface ManualMeasurement {
  plant_id: number;
  root_length_cm: number;
  shoot_length_cm: number;
  total_length_cm: number;
}

interface PreviousMeasurement {
  id: string;
  name: string;
  timestamp: string;
  data: ManualMeasurement[];
  germination_percentage: number;
}

interface ManualMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: any;
  apiUrl: string;
  onMeasurementSubmitted: (measurements: any) => void;
}

const ManualMeasurementModal: React.FC<ManualMeasurementModalProps> = ({
  visible,
  onClose,
  analysis,
  apiUrl,
  onMeasurementSubmitted,
}) => {
  const [step, setStep] = useState<'choice' | 'count' | 'input' | 'loading'>('choice');
  const [plantCount, setPlantCount] = useState('');
  const [measurements, setMeasurements] = useState<ManualMeasurement[]>([]);
  const [previousMeasurements, setPreviousMeasurements] = useState<PreviousMeasurement[]>([]);
  const [selectedPrevious, setSelectedPrevious] = useState<PreviousMeasurement | null>(null);
  const [loading, setLoading] = useState(false);
  const [flowType, setFlowType] = useState<'manual' | 'copy' | null>(null);
  
  // Get analysis name and run number
  const analysisName = analysis?.analysis_name || 'Untitled Analysis';
  const analysisId = analysis?.id || 'Unknown';
  // Extract run number from ID like "iteration_21" -> 21
  const runNumber = analysisId.match(/\d+$/) ? analysisId.match(/\d+$/)?.[0] : analysisId;

  // Load previous manual measurements
  useEffect(() => {
    if (visible) {
      loadPreviousMeasurements();
    }
  }, [visible, analysis?.user_id, apiUrl]);

  const loadPreviousMeasurements = async () => {
    try {
      const userId = analysis?.user_id || 'user';
      console.log('Loading previous measurements for user:', userId);
      const response = await fetch(
        `${apiUrl}/manual-measurements/${userId}/all`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Previous measurements loaded:', data.measurements);
        setPreviousMeasurements(data.measurements || []);
      } else {
        console.warn('Failed to fetch previous measurements, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load previous measurements:', error);
    }
  };

  const handleCopyPrevious = () => {
    if (!selectedPrevious) return;
    
    Alert.alert(
      'Copy & Submit',
      `Copy measurements from "${selectedPrevious.name}" (${selectedPrevious.data.length} plants) and submit directly?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Copy & Submit', onPress: () => submitCopiedMeasurements(), style: 'default' },
      ]
    );
  };

  const submitCopiedMeasurements = async () => {
    if (!selectedPrevious) return;
    
    setLoading(true);
    try {
      const userId = analysis?.user_id || analysis?.id?.split('_')[0] || 'user';
      const analysisId = analysis?.id || '';
      
      const roundedMeasurements = selectedPrevious.data.map(m => ({
        plant_id: m.plant_id,
        root_length_cm: Math.round(m.root_length_cm * 100) / 100,
        shoot_length_cm: Math.round(m.shoot_length_cm * 100) / 100,
        total_length_cm: Math.round(m.total_length_cm * 100) / 100,
      }));

      const payload = {
        analysis_id: analysisId,
        user_id: userId,
        timestamp: new Date().toISOString(),
        measurements: roundedMeasurements,
        germination_percentage: analysis?.germination_percentage || 0,
      };

      console.log('Submitting copied measurements:', payload);

      const response = await fetch(`${apiUrl}/manual-measurements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = 'Failed to submit measurements';
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      Alert.alert('Success', 'Measurements copied and submitted!');
      setStep('choice');
      setFlowType(null);
      setSelectedPrevious(null);
      onClose();
      onMeasurementSubmitted(JSON.parse(responseText));
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlantCountSubmit = () => {
    const count = parseInt(plantCount);
    if (!plantCount || isNaN(count) || count <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of plants');
      return;
    }

    // Create new measurements for manual entry
    const newMeasurements: ManualMeasurement[] = Array.from({ length: count }, (_, i) => ({
      plant_id: i + 1,
      root_length_cm: 0,
      shoot_length_cm: 0,
      total_length_cm: 0,
    }));
    setMeasurements(newMeasurements);
    setStep('input');
  };

  const handleMeasurementChange = (
    index: number,
    field: 'root_length_cm' | 'shoot_length_cm',
    value: string
  ) => {
    const newMeasurements = [...measurements];
    
    if (value === '') {
      newMeasurements[index][field] = 0;
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        newMeasurements[index][field] = numValue;
      } else if (value === '.' || /^\d+\.$/.test(value)) {
        // Allow intermediate state like "5."
        const partial = value.replace(/\.$/, '');
        newMeasurements[index][field] = partial === '' ? 0 : parseFloat(partial);
      }
    }
    
    const root = parseFloat(newMeasurements[index].root_length_cm?.toString() || '0');
    const shoot = parseFloat(newMeasurements[index].shoot_length_cm?.toString() || '0');
    newMeasurements[index].total_length_cm = Math.round((root + shoot) * 100) / 100;
    
    setMeasurements(newMeasurements);
  };

  const handleSubmitMeasurements = async () => {
    // Validation
    const allValid = measurements.every(m => m.root_length_cm > 0 && m.shoot_length_cm > 0);
    if (!allValid) {
      Alert.alert('Invalid Input', 'All plants must have root and shoot measurements > 0');
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - ensure proper structure
      const userId = analysis?.user_id || analysis?.id?.split('_')[0] || 'user';
      const analysisId = analysis?.id || '';
      
      // Round measurements to 2 decimal places before submission
      const roundedMeasurements = measurements.map(m => ({
        plant_id: m.plant_id,
        root_length_cm: Math.round(m.root_length_cm * 100) / 100,
        shoot_length_cm: Math.round(m.shoot_length_cm * 100) / 100,
        total_length_cm: Math.round(m.total_length_cm * 100) / 100,
      }));

      const payload = {
        analysis_id: analysisId,
        user_id: userId,
        timestamp: new Date().toISOString(),
        measurements: roundedMeasurements,
        germination_percentage: analysis?.germination_percentage || 0,
      };

      console.log('Submitting manual measurements:', payload);

      // Submit to backend
      const response = await fetch(`${apiUrl}/manual-measurements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status, 'Text:', responseText);

      if (!response.ok) {
        let errorMsg = 'Failed to submit measurements';
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const result = JSON.parse(responseText);
      Alert.alert('Success', 'Manual measurements submitted successfully!');

      // Reset and close
      setStep('count');
      setPlantCount('');
      setSelectedPrevious('');
      setMeasurements([]);
      onClose();

      // Notify parent
      onMeasurementSubmitted(result);
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Manual Measurement</Text>
              <Text style={styles.headerRunNumber}>#{runNumber}</Text>
            </View>
            <Text style={styles.headerSubtitle}>{analysisName}</Text>
          </View>
          <View style={{ width: 30 }} />
        </View>

        {/* STEP 1: Choose Flow Type */}
        {step === 'choice' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentCenter}>
            <Text style={styles.choiceTitle}>How would you like to submit measurements?</Text>
            
            {/* Option A: Manual Entry */}
            <View style={styles.choiceOptionBox}>
              <View style={styles.choiceHeader}>
                <Text style={styles.choiceOptionTitle}>📝 Manual Entry</Text>
                <Text style={styles.choiceLabel}>New measurement</Text>
              </View>
              <Text style={styles.choiceDescription}>
                Enter the number of plants and manually input root & shoot measurements for each plant. Good for new test runs.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setFlowType('manual');
                  setStep('count');
                }}
              >
                <Text style={styles.buttonText}>Start Manual Entry</Text>
              </TouchableOpacity>
            </View>

            {/* Option B: Copy from Previous */}
            {previousMeasurements.length > 0 ? (
              <View style={styles.choiceOptionBox}>
                <View style={styles.choiceHeader}>
                  <Text style={styles.choiceOptionTitle}>📋 Copy & Submit</Text>
                  <Text style={styles.choiceLabel}>From previous run</Text>
                </View>
                <Text style={styles.choiceDescription}>
                  Select a previous measurement and submit directly without editing. Quick for reusing same data.
                </Text>
                
                {/* Dropdown-like selector */}
                {selectedPrevious ? (
                  <TouchableOpacity
                    style={styles.selectedPreviousBox}
                    onPress={() => setSelectedPrevious(null)}
                  >
                    <View style={styles.selectedPreviousContent}>
                      <Text style={styles.selectedPreviousLabel}>{selectedPrevious.name}</Text>
                      <Text style={styles.selectedPreviousSubtitle}>{selectedPrevious.data.length} plants</Text>
                    </View>
                    <Text style={styles.selectedPreviousIcon}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setFlowType('copy')}
                  >
                    <Text style={styles.dropdownButtonText}>Select from previous runs ▼</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, !selectedPrevious && styles.buttonDisabled]}
                  onPress={handleCopyPrevious}
                  disabled={!selectedPrevious || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Copy & Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.choiceOptionBox, styles.disabledBox]}>
                <Text style={styles.choiceOptionTitle}>📋 Copy & Submit</Text>
                <Text style={styles.choiceDescription}>No previous measurements available</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* STEP 1B: Choose Previous Measurement */}
        {step === 'choice' && flowType === 'copy' && (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Select Previous Run</Text>
            <View style={styles.listContainer}>
              {previousMeasurements.map((prev) => (
                <TouchableOpacity
                  key={prev.id}
                  style={[
                    styles.listItem,
                    selectedPrevious?.id === prev.id && styles.listItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPrevious(prev);
                    setFlowType(null);
                  }}
                >
                  <View style={styles.listItemContent}>
                    <Text
                      style={[
                        styles.listItemLabel,
                        selectedPrevious?.id === prev.id && styles.listItemLabelSelected,
                      ]}
                    >
                      {prev.name}
                    </Text>
                    <Text
                      style={[
                        styles.listItemSubtitle,
                        selectedPrevious?.id === prev.id && styles.listItemSubtitleSelected,
                      ]}
                    >
                      {prev.data.length} plants
                    </Text>
                  </View>
                  {selectedPrevious?.id === prev.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* STEP 2: Enter Number of Plants */}
        {step === 'count' && flowType === 'manual' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentCenter}>
            <Text style={styles.choiceTitle}>Enter Number of Plants</Text>
            <Text style={styles.helpText}>How many plants did you measure?</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Number of plants"
              keyboardType="number-pad"
              value={plantCount}
              onChangeText={setPlantCount}
            />
            <TouchableOpacity
              style={[styles.button, !plantCount && styles.buttonDisabled]}
              onPress={handlePlantCountSubmit}
              disabled={!plantCount}
            >
              <Text style={styles.buttonText}>Continue to Measurements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setStep('choice');
                setFlowType(null);
                setPlantCount('');
              }}
            >
              <Text style={styles.secondaryButtonText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 'input' && (
          <ScrollView style={styles.content}>
            <Text style={styles.title}>Enter Root & Shoot Measurements (cm)</Text>

            <View style={styles.measurementTable}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.headerCell, { flex: 0.6 }]}>Plant</Text>
                <Text style={[styles.tableCell, styles.headerCell, { flex: 1.2 }]}>Root</Text>
                <Text style={[styles.tableCell, styles.headerCell, { flex: 1.2 }]}>Shoot</Text>
                <Text style={[styles.tableCell, styles.headerCell, { flex: 1.2 }]}>Total</Text>
              </View>

              {measurements.map((measurement, idx) => (
                <View key={measurement.plant_id} style={[styles.tableRow, idx % 2 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, styles.plantLabel, { flex: 0.6 }]}>
                    P{measurement.plant_id}
                  </Text>
                  <TextInput
                    style={[styles.tableCell, styles.input, { flex: 1.2 }]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={measurement.root_length_cm === 0 ? '' : measurement.root_length_cm.toString()}
                    onChangeText={(v) =>
                      handleMeasurementChange(idx, 'root_length_cm', v)
                    }
                    maxLength={7}
                  />
                  <TextInput
                    style={[styles.tableCell, styles.input, { flex: 1.2 }]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={measurement.shoot_length_cm === 0 ? '' : measurement.shoot_length_cm.toString()}
                    onChangeText={(v) =>
                      handleMeasurementChange(idx, 'shoot_length_cm', v)
                    }
                    maxLength={7}
                  />
                  <Text style={[styles.tableCell, styles.totalValue, { flex: 1.2 }]}>
                    {measurement.total_length_cm.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Root</Text>
                  <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                    {(measurements.reduce((acc, m) => acc + m.root_length_cm, 0) / measurements.length).toFixed(2)} cm
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Shoot</Text>
                  <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
                    {(measurements.reduce((acc, m) => acc + m.shoot_length_cm, 0) / measurements.length).toFixed(2)} cm
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Total</Text>
                  <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
                    {(measurements.reduce((acc, m) => acc + m.total_length_cm, 0) / measurements.length).toFixed(2)} cm
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.sviRow}>
                <Text style={styles.summaryLabel}>SVI (with {Math.round(analysis?.germination_percentage || 0)}% germination)</Text>
                <Text style={styles.sviValue}>
                  {(
                    (measurements.reduce((acc, m) => acc + m.total_length_cm, 0) / measurements.length) *
                    (analysis?.germination_percentage || 0)
                  ).toFixed(0)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmitMeasurements}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setStep('count');
                setMeasurements([]);
              }}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderBottomWidth: 1,
    borderBottomColor: '#15803d',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRunNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcfce7',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 28,
    color: '#fff',
    width: 30,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentCenter: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  previousSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  previousLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 200,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemSelected: {
    backgroundColor: '#dcfce7',
  },
  listItemContent: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  listItemLabelSelected: {
    color: '#16a34a',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  listItemSubtitleSelected: {
    color: '#15803d',
  },
  checkmark: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  noDataText: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 20,
    textAlign: 'center',
  },
  choiceOptionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#16a34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledBox: {
    opacity: 0.6,
    backgroundColor: '#f3f4f6',
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  choiceOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  choiceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  choiceDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedPreviousBox: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPreviousContent: {
    flex: 1,
  },
  selectedPreviousLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  selectedPreviousSubtitle: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
  selectedPreviousIcon: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  measurementTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#16a34a',
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '700',
  },
  plantLabel: {
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 4,
  },
  totalValue: {
    fontWeight: '700',
    color: '#8b5cf6',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  summaryBox: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#fcd34d',
    marginVertical: 10,
  },
  sviRow: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  sviValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 6,
  },
});

export default ManualMeasurementModal;
