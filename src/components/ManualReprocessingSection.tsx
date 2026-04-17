/**
 * ManualReprocessingSection.tsx
 *
 * Interactive full-screen modal that shows the consolidated path
 * visualization image with pinch-to-zoom. Users tap directly on
 * branches drawn in the image to select root/shoot paths.
 *
 * The SVG overlay is invisible except for highlight outlines on
 * the currently selected paths, so the user feels they are
 * interacting with the image itself.
 */
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  type: 'seed' | 'junction' | 'endpoint';
}

interface GraphBranch {
  id: string;
  start_node_id: string;
  end_node_id: string;
  points: number[][]; // [x, y][]
  length_pixels: number;
  default_included: boolean;
}

interface CandidatePath {
  id: string;
  branch_ids: string[];
  tip_point: Point;
  length_pixels: number;
  is_default_biggest: boolean;
}

interface PlantGraph {
  plant_id: number;
  seed_point: Point;
  root: {
    nodes: GraphNode[];
    branches: GraphBranch[];
    candidate_paths: CandidatePath[];
  };
  shoot: {
    nodes: GraphNode[];
    branches: GraphBranch[];
    candidate_paths: CandidatePath[];
  };
}

interface ReprocessingData {
  analysis_id: string;
  reference_image: { url: string; width: number; height: number };
  calibration: { cm_per_pixel: number };
  plants: PlantGraph[];
}

interface PlantEditState {
  selectedRootPathId: string | null;
  selectedShootPathId: string | null;
}

interface PlantMeasurement {
  plant_id: number;
  root_cm: number;
  shoot_cm: number;
  total_cm: number;
}

interface OrganIndex {
  branchById: Map<string, GraphBranch>;
  pathsByBranchId: Map<string, CandidatePath[]>;
}

interface Props {
  analysisId: string;
  userId: string;
  apiUrl: string;
  imageUrl: string | null;
  plants: { id: number; root_length_cm: number; shoot_length_cm: number; total_length_cm: number }[];
  onMeasurementsChanged?: (measurements: PlantMeasurement[]) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildOrganIndex(organ: { branches: GraphBranch[]; candidate_paths: CandidatePath[] }): OrganIndex {
  const branchById = new Map(organ.branches.map(b => [b.id, b]));
  const pathsByBranchId = new Map<string, CandidatePath[]>();

  for (const path of organ.candidate_paths) {
    for (const branchId of path.branch_ids) {
      if (!pathsByBranchId.has(branchId)) {
        pathsByBranchId.set(branchId, []);
      }
      pathsByBranchId.get(branchId)!.push(path);
    }
  }

  return { branchById, pathsByBranchId };
}

function chooseBestPath(
  candidates: CandidatePath[],
  tappedBranchId: string,
  branchById: Map<string, GraphBranch>,
): CandidatePath {
  if (candidates.length === 1) return candidates[0];

  let best = candidates[0];
  let bestSuffix = -1;

  for (const path of candidates) {
    const idx = path.branch_ids.indexOf(tappedBranchId);
    if (idx < 0) continue;
    const suffixIds = path.branch_ids.slice(idx);
    const suffixLen = suffixIds.reduce((sum, bid) => {
      const b = branchById.get(bid);
      return sum + (b?.length_pixels ?? 0);
    }, 0);
    if (suffixLen > bestSuffix) {
      bestSuffix = suffixLen;
      best = path;
    }
  }

  return best;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Component ──────────────────────────────────────────────────────────────

const ManualReprocessingSection: React.FC<Props> = ({
  analysisId,
  userId,
  apiUrl,
  imageUrl,
  plants: originalPlants,
  onMeasurementsChanged,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReprocessingData | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<number>(1);
  const [plantEdits, setPlantEdits] = useState<Record<number, PlantEditState>>({});
  const zoomRef = useRef<any>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiUrl}/manual-reprocessing-graph/${userId}/${analysisId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const json: ReprocessingData = await response.json();
      setData(json);

      const initial: Record<number, PlantEditState> = {};
      for (const plant of json.plants) {
        const defaultRoot = plant.root.candidate_paths.find(p => p.is_default_biggest);
        const defaultShoot = plant.shoot.candidate_paths.find(p => p.is_default_biggest);
        initial[plant.plant_id] = {
          selectedRootPathId: defaultRoot?.id ?? null,
          selectedShootPathId: defaultShoot?.id ?? null,
        };
      }
      setPlantEdits(initial);
      if (json.plants.length > 0) {
        setSelectedPlantId(json.plants[0].plant_id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, userId, analysisId]);

  useEffect(() => {
    if (modalVisible && !data && !loading) {
      fetchGraphData();
    }
  }, [modalVisible, data, loading, fetchGraphData]);

  // ─── Derived Data ─────────────────────────────────────────────────────

  const selectedPlant = useMemo(
    () => data?.plants.find(p => p.plant_id === selectedPlantId) ?? null,
    [data, selectedPlantId],
  );

  const currentEdit = useMemo(
    () => plantEdits[selectedPlantId] ?? { selectedRootPathId: null, selectedShootPathId: null },
    [plantEdits, selectedPlantId],
  );

  // Per-plant indexes for all plants (for tap handling on any plant)
  const allPlantIndexes = useMemo(() => {
    if (!data) return new Map<number, { root: OrganIndex; shoot: OrganIndex }>();
    const map = new Map<number, { root: OrganIndex; shoot: OrganIndex }>();
    for (const plant of data.plants) {
      map.set(plant.plant_id, {
        root: buildOrganIndex(plant.root),
        shoot: buildOrganIndex(plant.shoot),
      });
    }
    return map;
  }, [data]);

  // Selected branch IDs for the active plant
  const selectedRootBranchIds = useMemo(() => {
    if (!selectedPlant || !currentEdit.selectedRootPathId) return new Set<string>();
    const path = selectedPlant.root.candidate_paths.find(p => p.id === currentEdit.selectedRootPathId);
    return new Set(path?.branch_ids ?? []);
  }, [selectedPlant, currentEdit.selectedRootPathId]);

  const selectedShootBranchIds = useMemo(() => {
    if (!selectedPlant || !currentEdit.selectedShootPathId) return new Set<string>();
    const path = selectedPlant.shoot.candidate_paths.find(p => p.id === currentEdit.selectedShootPathId);
    return new Set(path?.branch_ids ?? []);
  }, [selectedPlant, currentEdit.selectedShootPathId]);

  // ─── Measurements Recalculation ───────────────────────────────────────

  const recalculatedMeasurements = useMemo((): PlantMeasurement[] => {
    if (!data) return [];

    return data.plants.map(plant => {
      const edit = plantEdits[plant.plant_id];
      if (!edit) {
        const orig = originalPlants.find(p => p.id === plant.plant_id);
        return {
          plant_id: plant.plant_id,
          root_cm: orig?.root_length_cm ?? 0,
          shoot_cm: orig?.shoot_length_cm ?? 0,
          total_cm: orig?.total_length_cm ?? 0,
        };
      }

      const cmPerPixel = data.calibration.cm_per_pixel;

      let rootPixels = 0;
      if (edit.selectedRootPathId) {
        const path = plant.root.candidate_paths.find(p => p.id === edit.selectedRootPathId);
        if (path) {
          rootPixels = path.branch_ids.reduce((sum, bid) => {
            const branch = plant.root.branches.find(b => b.id === bid);
            return sum + (branch?.length_pixels ?? 0);
          }, 0);
        }
      }

      let shootPixels = 0;
      if (edit.selectedShootPathId) {
        const path = plant.shoot.candidate_paths.find(p => p.id === edit.selectedShootPathId);
        if (path) {
          shootPixels = path.branch_ids.reduce((sum, bid) => {
            const branch = plant.shoot.branches.find(b => b.id === bid);
            return sum + (branch?.length_pixels ?? 0);
          }, 0);
        }
      }

      const rootCm = rootPixels * cmPerPixel;
      const shootCm = shootPixels * cmPerPixel;

      return {
        plant_id: plant.plant_id,
        root_cm: Math.round(rootCm * 100) / 100,
        shoot_cm: Math.round(shootCm * 100) / 100,
        total_cm: Math.round((rootCm + shootCm) * 100) / 100,
      };
    });
  }, [data, plantEdits, originalPlants]);

  useEffect(() => {
    if (recalculatedMeasurements.length > 0 && onMeasurementsChanged) {
      onMeasurementsChanged(recalculatedMeasurements);
    }
  }, [recalculatedMeasurements, onMeasurementsChanged]);

  // ─── Image dimensions for SVG alignment ───────────────────────────────

  const imgW = data?.reference_image.width ?? 1;
  const imgH = data?.reference_image.height ?? 1;
  const imgAspect = imgW / imgH;

  // The image fills the zoomable container width; height follows aspect ratio
  const displayW = SCREEN_W;
  const displayH = displayW / imgAspect;

  // ─── Interaction: tap a branch to select its path ─────────────────────

  const handleBranchTap = useCallback(
    (plantId: number, organ: 'root' | 'shoot', branchId: string) => {
      const indexes = allPlantIndexes.get(plantId);
      if (!indexes) return;

      const index = organ === 'root' ? indexes.root : indexes.shoot;
      const candidates = index.pathsByBranchId.get(branchId);
      if (!candidates || candidates.length === 0) return;

      const chosen = chooseBestPath(candidates, branchId, index.branchById);

      // Auto-select this plant
      setSelectedPlantId(plantId);

      setPlantEdits(prev => ({
        ...prev,
        [plantId]: {
          ...prev[plantId],
          selectedRootPathId:
            organ === 'root' ? chosen.id : (prev[plantId]?.selectedRootPathId ?? null),
          selectedShootPathId:
            organ === 'shoot' ? chosen.id : (prev[plantId]?.selectedShootPathId ?? null),
        },
      }));
    },
    [allPlantIndexes],
  );

  const handleResetPlant = () => {
    if (!selectedPlant) return;
    const defaultRoot = selectedPlant.root.candidate_paths.find(p => p.is_default_biggest);
    const defaultShoot = selectedPlant.shoot.candidate_paths.find(p => p.is_default_biggest);
    setPlantEdits(prev => ({
      ...prev,
      [selectedPlantId]: {
        selectedRootPathId: defaultRoot?.id ?? null,
        selectedShootPathId: defaultShoot?.id ?? null,
      },
    }));
  };

  // ─── SVG helpers ──────────────────────────────────────────────────────

  const pointsToString = (points: number[][]): string => {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  };

  // ─── Current plant measurement ────────────────────────────────────────

  const currentMeasurement = recalculatedMeasurements.find(m => m.plant_id === selectedPlantId);

  // Selected tips for indicator dots
  const selectedRootTip = useMemo(() => {
    if (!selectedPlant || !currentEdit.selectedRootPathId) return null;
    return selectedPlant.root.candidate_paths.find(p => p.id === currentEdit.selectedRootPathId)?.tip_point ?? null;
  }, [selectedPlant, currentEdit.selectedRootPathId]);

  const selectedShootTip = useMemo(() => {
    if (!selectedPlant || !currentEdit.selectedShootPathId) return null;
    return selectedPlant.shoot.candidate_paths.find(p => p.id === currentEdit.selectedShootPathId)?.tip_point ?? null;
  }, [selectedPlant, currentEdit.selectedShootPathId]);

  const handleClose = () => {
    try {
      if (zoomRef.current?.resetZoom) {
        zoomRef.current.resetZoom();
      }
    } catch (_) {}
    setModalVisible(false);
  };

  // ─── Render: Section in detail screen (collapsed button) ──────────────

  return (
    <>
      {/* Inline section — tap to open full-screen modal */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.expandButtonText}>🔧 Manual Reprocessing</Text>
          <Text style={styles.expandHint}>Tap to open full-screen path editor</Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>🔧 Manual Reprocessing</Text>
              <Text style={styles.headerHelp}>Pinch to zoom • Tap a branch to select path</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Loading / Error ── */}
          {loading && (
            <View style={styles.centeredMessage}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading skeleton data...</Text>
            </View>
          )}

          {error && (
            <View style={styles.centeredMessage}>
              <Text style={styles.errorText}>⚠ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchGraphData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Zoomable image + interactive SVG ── */}
          {data && data.plants.length > 0 && (
            <View style={styles.zoomArea}>
              <ReactNativeZoomableView
                ref={zoomRef}
                maxZoom={6}
                minZoom={1}
                initialZoom={1}
                zoomEnabled={true}
                panEnabled={true}
                doubleTapZoomToCenter={true}
                contentWidth={displayW}
                contentHeight={displayH}
                style={styles.zoomView}
              >
                <View style={{ width: displayW, height: displayH }}>
                  <RNImage
                    source={{ uri: `${apiUrl}${data.reference_image.url}` }}
                    style={{ width: displayW, height: displayH }}
                    resizeMode="contain"
                  />

                  <Svg
                    style={StyleSheet.absoluteFill}
                    width={displayW}
                    height={displayH}
                    viewBox={`0 0 ${imgW} ${imgH}`}
                  >
                    {/* ── Layer 1: Full skeleton in white for ALL plants ── */}
                    {data.plants.map(plant => (
                      <React.Fragment key={`base-${plant.plant_id}`}>
                        {plant.root.branches.map(branch => (
                          <Polyline
                            key={`base-r-${branch.id}`}
                            points={pointsToString(branch.points)}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.6}
                          />
                        ))}
                        {plant.shoot.branches.map(branch => (
                          <Polyline
                            key={`base-s-${branch.id}`}
                            points={pointsToString(branch.points)}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.6}
                          />
                        ))}
                      </React.Fragment>
                    ))}

                    {/* ── Layer 2: Selected root/shoot highlights for active plant ── */}
                    {selectedPlant && (
                      <>
                        {selectedPlant.root.branches.map(branch =>
                          selectedRootBranchIds.has(branch.id) ? (
                            <Polyline
                              key={`sel-r-${branch.id}`}
                              points={pointsToString(branch.points)}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth={5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={0.9}
                            />
                          ) : null,
                        )}
                        {selectedPlant.shoot.branches.map(branch =>
                          selectedShootBranchIds.has(branch.id) ? (
                            <Polyline
                              key={`sel-s-${branch.id}`}
                              points={pointsToString(branch.points)}
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth={5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={0.9}
                            />
                          ) : null,
                        )}
                      </>
                    )}

                    {/* ── Layer 3: Invisible hit targets for ALL plants ── */}
                    {data.plants.map(plant => (
                      <React.Fragment key={`hit-${plant.plant_id}`}>
                        {plant.root.branches.map(branch => (
                          <Polyline
                            key={`hit-r-${branch.id}`}
                            points={pointsToString(branch.points)}
                            fill="none"
                            stroke="rgba(0,0,0,0.01)"
                            strokeWidth={28}
                            onPress={() => handleBranchTap(plant.plant_id, 'root', branch.id)}
                          />
                        ))}
                        {plant.shoot.branches.map(branch => (
                          <Polyline
                            key={`hit-s-${branch.id}`}
                            points={pointsToString(branch.points)}
                            fill="none"
                            stroke="rgba(0,0,0,0.01)"
                            strokeWidth={28}
                            onPress={() => handleBranchTap(plant.plant_id, 'shoot', branch.id)}
                          />
                        ))}
                      </React.Fragment>
                    ))}

                    {/* ── Layer 4: Seed points + P1..Pn labels for ALL plants ── */}
                    {data.plants.map(plant => {
                      const isActive = plant.plant_id === selectedPlantId;
                      return (
                        <React.Fragment key={`seed-${plant.plant_id}`}>
                          <Circle
                            cx={plant.seed_point.x}
                            cy={plant.seed_point.y}
                            r={isActive ? 8 : 6}
                            fill={isActive ? '#00ffff' : '#ffffff'}
                            stroke="#000000"
                            strokeWidth={2}
                          />
                          <SvgText
                            x={plant.seed_point.x + 14}
                            y={plant.seed_point.y + 5}
                            fill={isActive ? '#00ffff' : '#ffffff'}
                            stroke="#000000"
                            strokeWidth={0.5}
                            fontSize={16}
                            fontWeight="bold"
                          >
                            P{plant.plant_id}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}

                    {/* ── Selected root tip ── */}
                    {selectedRootTip && (
                      <Circle
                        cx={selectedRootTip.x}
                        cy={selectedRootTip.y}
                        r={8}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}

                    {/* ── Selected shoot tip ── */}
                    {selectedShootTip && (
                      <Circle
                        cx={selectedShootTip.x}
                        cy={selectedShootTip.y}
                        r={8}
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}
                  </Svg>
                </View>
              </ReactNativeZoomableView>
            </View>
          )}

          {/* ── Bottom panel: measurements + reset ── */}
          {data && data.plants.length > 0 && (
            <View style={styles.bottomPanel}>
              {/* Legend row */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ffffff', opacity: 0.6 }]} />
                  <Text style={styles.legendText}>Skeleton</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Root</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.legendText}>Shoot</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00ffff' }]} />
                  <Text style={styles.legendText}>Active Seed</Text>
                </View>
              </View>

              {/* Active plant + Measurements */}
              {currentMeasurement && (
                <>
                  <Text style={styles.activePlantLabel}>
                    Plant {selectedPlantId}
                  </Text>
                  <View style={styles.measurementRow}>
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Root</Text>
                      <Text style={[styles.measurementValue, { color: '#ef4444' }]}>
                        {currentMeasurement.root_cm.toFixed(2)} cm
                      </Text>
                    </View>
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Shoot</Text>
                      <Text style={[styles.measurementValue, { color: '#22c55e' }]}>
                        {currentMeasurement.shoot_cm.toFixed(2)} cm
                      </Text>
                    </View>
                    <View style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>Total</Text>
                      <Text style={[styles.measurementValue, { color: '#a78bfa' }]}>
                        {currentMeasurement.total_cm.toFixed(2)} cm
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {!currentMeasurement && (
                <Text style={styles.tapHintText}>Tap a branch on any plant to begin</Text>
              )}

              {/* Reset */}
              {selectedPlant && (
                <TouchableOpacity style={styles.resetButton} onPress={handleResetPlant}>
                  <Text style={styles.resetButtonText}>↺ Reset P{selectedPlantId} to AI Default</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Inline section (collapsed) ──
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    marginBottom: Spacing[3],
    ...Shadows.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  expandButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.warning,
  },
  expandHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.gray500,
    marginTop: Spacing[1],
  },

  // ── Modal chrome ──
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1f2937',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#f59e0b',
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerHelp: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ── Centered messages ──
  centeredMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // ── Zoomable area ──
  zoomArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  zoomView: {
    flex: 1,
    width: SCREEN_W,
  },

  // ── Bottom panel ──
  bottomPanel: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#d1d5db',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activePlantLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  tapHintText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    color: '#d1d5db',
    fontWeight: '600',
  },
});

export default ManualReprocessingSection;
