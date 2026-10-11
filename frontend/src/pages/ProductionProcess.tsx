import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Play,
  Save,
  Layers,
  Droplets,
  Scissors,
  PackageCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TimerReset,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  Calendar,
  AlertCircle,
  X,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormSection } from '../components/FormSection';
import { OrderConsumptions } from '../components/OrderConsumptions';
import { useAuth } from '../hooks/useAuth';

type StageType = 'IMPRESION' | 'LAMINACION' | 'REFILADO' | 'CONFECCION';

const STAGES: { key: StageType; label: string; icon: LucideIcon; description: string }[] = [
  { key: 'IMPRESION', label: 'Impresión', icon: Layers, description: 'Flexografía y tirada de bobinas' },
  { key: 'LAMINACION', label: 'Laminación', icon: Droplets, description: 'Montaje de multicapa y curado' },
  { key: 'REFILADO', label: 'Refilado', icon: Scissors, description: 'Corte a ancho y rebobinado CMM' },
  { key: 'CONFECCION', label: 'Confección', icon: PackageCheck, description: 'Sellado, corte y empaque de bolsas' }
];

const APPROVAL_FIELDS: Record<StageType, string> = {
  IMPRESION: 'approvedPrinting',
  LAMINACION: 'approvedLamination',
  REFILADO: 'approvedRefilado',
  CONFECCION: 'approvedConfeccion'
};

// Checklist templates by stage matching Silcar operational standard
const STAGE_CHECKLIST_TEMPLATES: Record<StageType, { time: string; controlName: string; checked: boolean; value: string }[]> = {
  IMPRESION: [
    { time: 'Campo', controlName: 'Nombre encargado', checked: false, value: '' },
    { time: 'Control', controlName: 'Texto', checked: false, value: '' },
    { time: 'Control', controlName: 'Corte', checked: false, value: '' },
    { time: 'Control', controlName: 'Tono', checked: false, value: '' },
    { time: 'Control', controlName: 'Ancho material', checked: false, value: '' },
    { time: 'Campo', controlName: 'Observación', checked: false, value: '' },
    { time: 'Campo', controlName: 'Producto', checked: false, value: '' },
    { time: 'Campo', controlName: 'Nombre', checked: false, value: '' }
  ],
  LAMINACION: [
    { time: 'Campo', controlName: 'Nombre encargado', checked: false, value: '' },
    { time: 'Campo', controlName: 'Carga', checked: false, value: '' },
    { time: 'Control', controlName: 'Ancho', checked: false, value: '' },
    { time: 'Control', controlName: 'Tipo material', checked: false, value: '' },
    { time: 'Control', controlName: 'Sin agujas', checked: false, value: '' }
  ],
  REFILADO: [
    { time: 'Campo', controlName: 'Nombre control', checked: false, value: '' },
    { time: 'Control', controlName: 'Taca der-izq', checked: false, value: '' },
    { time: 'Control', controlName: 'Ancho espira', checked: false, value: '' },
    { time: 'Control', controlName: 'Sentido de salida', checked: false, value: '' }
  ],
  CONFECCION: [
    { time: 'Campo', controlName: 'Supervisor', checked: false, value: '' },
    { time: 'Control', controlName: 'Sellado central', checked: false, value: '' },
    { time: 'Control', controlName: 'Sellado base', checked: false, value: '' },
    { time: 'Control', controlName: 'Imagen centrada', checked: false, value: '' },
    { time: 'Control', controlName: 'Temp de maq', checked: false, value: '' },
    { time: 'Control', controlName: 'Teflon en condiciones', checked: false, value: '' }
  ]
};

const CHECKLIST_BOOLEAN_FIELDS = new Set([
  'Texto', 'Corte', 'Tono', 'Ancho material', 'Ancho', 'Tipo material',
  'Sin agujas', 'Taca der-izq', 'Ancho espira', 'Sentido de salida',
  'Sellado central', 'Sellado base', 'Imagen centrada', 'Temp de maq', 'Teflon en condiciones'
]);

const getLogDurationMinutes = (log: any) => {
  const start = new Date(log.startTime).getTime();
  const end = new Date(log.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
};

const getInputDurationMinutes = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  if ([startHours, startMinutes, endHours, endMinutes].some((v) => Number.isNaN(v))) return 0;
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal > startTotal ? endTotal - startTotal : 0;
};

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours && rem) return `${hours} h ${rem} min`;
  if (hours) return `${hours} h`;
  return `${rem} min`;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const formatLogTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const createInitialStageData = () => ({
  machineId: '',
  operatorId: '',
  exitSense: '',
  processedMeters: '',
  coilDiameter: '',
  coilCount: '',
  mixProportion: '',
  scrapKg: '0',
  observations: '',
  tacaRight: '',
  tacaLeft: '',
  dePie: false,
  deCabeza: false,
  deTripa: false,
  anchoEspira: '',
  controlName: '',
  tacaDerIzq: '',
  finalAnchoEspira: '',
  finalExitSense: '',
  bobbinCountName: ''
});

const createInitialMaterialLot = () => ({
  lotNumber: '',
  kg: '',
  initialMeters: '',
  addedMeters: '',
  finalMeters: '',
  observations: ''
});

const createInitialOutputBobbin = (index = 1) => ({
  label: `Bobina ${index}`,
  productName: '',
  kg: '',
  notes: ''
});

const createInitialScrapEntry = (index = 1) => ({
  kg: '',
  description: `Scrap ${index}`
});

const createInitialMetricEntry = (index = 1) => ({
  meters: '',
  scrapKg: '',
  coilCount: '',
  description: `Tramo ${index}`
});

const createInitialConfeccionOutput = () => ({
  productId: '',
  productName: '',
  bagQty: '',
  notes: ''
});

export const ProductionProcess: React.FC = () => {
  const { user } = useAuth();
  const [activeStage, setActiveStage] = useState<StageType>('IMPRESION');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTimeLog, setSavingTimeLog] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingQuality, setSavingQuality] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);

  // Operational tab within selected order detail
  const [activeTab, setActiveTab] = useState<'METRICS' | 'SPECS' | 'TIMES' | 'QUALITY'>('METRICS');

  // Work Queue filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROCESS' | 'PENDING' | 'FINISHED'>('ALL');

  // Confirmation modals
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'FINISH_STAGE' | 'FINISH_PRODUCT' | 'REOPEN_PRODUCT' | null;
    title: string;
    description: string;
  }>({
    open: false,
    type: null,
    title: '',
    description: ''
  });

  // Operational stage form data
  const [stageData, setStageData] = useState(createInitialStageData());
  const [materialLots, setMaterialLots] = useState([createInitialMaterialLot()]);
  const [metricEntries, setMetricEntries] = useState([createInitialMetricEntry()]);
  const [refiladoOutputBobbins, setRefiladoOutputBobbins] = useState([createInitialOutputBobbin()]);
  const [refiladoScrapEntries, setRefiladoScrapEntries] = useState([createInitialScrapEntry()]);
  const [confeccionOutputs, setConfeccionOutputs] = useState([createInitialConfeccionOutput()]);
  const [stageActionInFlight, setStageActionInFlight] = useState<'START' | 'FINISH' | 'FINISH_PRODUCT' | 'REOPEN' | null>(null);

  // Checklist & Quality state
  const [checklistItems, setChecklistItems] = useState(STAGE_CHECKLIST_TEMPLATES.IMPRESION);
  const [qualityStatus, setQualityStatus] = useState<'APROBADO' | 'OBSERVADO' | 'RECHAZADO'>('APROBADO');
  const [qualityObservations, setQualityObservations] = useState('');

  // Time log form data
  const [timeLogData, setTimeLogData] = useState({
    operatorId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    startTime: '',
    endTime: ''
  });

  // 1. Lock stage to user machine type if MACHINE role
  useEffect(() => {
    if (user?.role === 'MACHINE' && user.machine?.type) {
      const normalizedType = String(user.machine.type).toUpperCase() as StageType;
      if (STAGES.some((s) => s.key === normalizedType)) {
        setActiveStage(normalizedType);
        setStageData((prev) => ({ ...prev, machineId: user.machine?.id?.toString() || prev.machineId }));
      }
    }
  }, [user?.machine?.id, user?.machine?.type, user?.role]);

  // 2. Fetch orders and reference data
  const fetchOrders = async () => {
    try {
      const ordersRes = await api.get('/orders');
      setOrders(ordersRes.data.filter((order: any) => order.status !== 'Entregadas'));
    } catch (err: any) {
      console.error(err);
      setError('Error al actualizar las órdenes de la planta.');
    }
  };

  const fetchSelectedOrder = async (orderId: string) => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }
    const orderRes = await api.get(`/orders/${orderId}`);
    setSelectedOrder(orderRes.data);
  };

  useEffect(() => {
    const fetchFloorData = async () => {
      try {
        const [machinesRes, operatorsRes] = await Promise.all([
          api.get('/machines'),
          api.get('/operators')
        ]);
        setMachines(machinesRes.data);
        setOperators(operatorsRes.data);
        await fetchOrders();
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la operación de planta.');
      } finally {
        setLoading(false);
      }
    };

    fetchFloorData();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchSelectedOrder(selectedOrderId).catch((err) => {
        console.error(err);
        setError('No se pudo cargar el detalle de la orden seleccionada.');
      });
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId]);

  // Stage reset when changing active stage
  useEffect(() => {
    setStageData((prev) => ({
      ...createInitialStageData(),
      machineId: user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() === activeStage
        ? user.machine.id.toString()
        : ''
    }));
    setProcessSuccess(null);
    setMaterialLots([createInitialMaterialLot()]);
    setMetricEntries([createInitialMetricEntry()]);
    setRefiladoOutputBobbins([createInitialOutputBobbin()]);
    setRefiladoScrapEntries([createInitialScrapEntry()]);
    setConfeccionOutputs([createInitialConfeccionOutput()]);
    setChecklistItems(STAGE_CHECKLIST_TEMPLATES[activeStage]?.map((it) => ({ ...it })) || []);
    setTimeLogData({
      operatorId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      startTime: '',
      endTime: ''
    });
  }, [activeStage, user?.machine?.id, user?.machine?.type, user?.role]);

  // Synchronize checklist and quality from selected order
  useEffect(() => {
    if (!selectedOrder) return;

    // Load checklist for active stage if present
    const existingChecklist = selectedOrder.checklists?.find((c: any) => c.stage === activeStage);
    if (existingChecklist && Array.isArray(existingChecklist.items) && existingChecklist.items.length > 0) {
      setChecklistItems(existingChecklist.items.map((it: any) => ({
        time: it.time || 'Control',
        controlName: it.controlName,
        checked: Boolean(it.checked),
        value: it.value || ''
      })));
    } else {
      setChecklistItems(STAGE_CHECKLIST_TEMPLATES[activeStage]?.map((it) => ({ ...it })) || []);
    }

    // Load quality control for active stage if present
    const existingQuality = selectedOrder.qualityControls?.find((q: any) => q.stage === activeStage);
    if (existingQuality) {
      try {
        const parsed = JSON.parse(existingQuality.data);
        setQualityStatus(parsed.status || 'APROBADO');
        setQualityObservations(parsed.observations || '');
      } catch {
        setQualityStatus('APROBADO');
        setQualityObservations(existingQuality.data || '');
      }
    } else {
      setQualityStatus('APROBADO');
      setQualityObservations('');
    }
  }, [selectedOrder, activeStage]);

  const StageIcon = useMemo(() => STAGES.find((s) => s.key === activeStage)?.icon || Layers, [activeStage]);
  const currentMachineLocked = user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() === activeStage;
  const canUseConsumptions = activeStage === 'IMPRESION' || activeStage === 'LAMINACION';
  const canUseMaterialLots = activeStage === 'IMPRESION' || activeStage === 'LAMINACION';
  const canUseOperationalMeters = activeStage === 'IMPRESION' || activeStage === 'LAMINACION';

  const orderProductOptions = useMemo(() => {
    if (!selectedOrder) return [];
    const rows = selectedOrder.products?.length
      ? selectedOrder.products.map((item: any) => item.product).filter(Boolean)
      : [selectedOrder.product].filter(Boolean);
    return rows.map((p: any) => ({
      id: p.id?.toString?.() || '',
      name: p.name || 'Producto sin nombre'
    }));
  }, [selectedOrder]);

  const defaultProductName = orderProductOptions[0]?.name || selectedOrder?.product?.name || '';

  const currentStageLogs = useMemo(() => {
    const stageProcess = selectedOrder?.processes?.filter((p: any) => p.type === activeStage) || [];
    return stageProcess.flatMap((p: any) => p.timeLogs || []);
  }, [activeStage, selectedOrder]);

  const currentStageTotalMinutes = useMemo(() => (
    currentStageLogs.reduce((acc: number, log: any) => acc + getLogDurationMinutes(log), 0)
  ), [currentStageLogs]);

  const currentInputDurationMinutes = useMemo(() => (
    getInputDurationMinutes(timeLogData.startTime, timeLogData.endTime)
  ), [timeLogData.startTime, timeLogData.endTime]);

  const plannedStages = useMemo(() => {
    const processTypes = new Set((selectedOrder?.processes || []).map((p: any) => p.type));
    return STAGES.map((s) => s.key).filter((s) => processTypes.has(s));
  }, [selectedOrder]);

  const plannedStageProcess = useMemo(() => (
    selectedOrder?.processes?.find((p: any) => p.type === activeStage && p.status === 'Planificada')
  ), [activeStage, selectedOrder]);

  const stageProcess = useMemo(() => {
    const processes = selectedOrder?.processes?.filter((p: any) => p.type === activeStage && p.status !== 'Planificada') || [];
    return processes.sort((a: any, b: any) => {
      const left = new Date(b.endTime || b.startTime || 0).getTime();
      const right = new Date(a.endTime || a.startTime || 0).getTime();
      return left - right;
    })[0];
  }, [activeStage, selectedOrder]);

  const lastStageOperatorId = useMemo(() => {
    const processes = selectedOrder?.processes?.filter((p: any) => p.type === activeStage && p.status !== 'Planificada') || [];
    const processWithOperator = processes
      .sort((a: any, b: any) => new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime())
      .find((p: any) => p.operatorId);
    return processWithOperator?.operatorId?.toString?.() || '';
  }, [activeStage, selectedOrder]);

  const isStagePlanned = plannedStages.includes(activeStage);
  const isStageInProcess = stageProcess?.status === 'en_proceso';
  const isStageFinished = Boolean(selectedOrder?.[APPROVAL_FIELDS[activeStage]]) || stageProcess?.status === 'finalizado';

  const allPlannedStagesFinished = plannedStages.length > 0 && plannedStages.every((stage) => {
    const proc = selectedOrder?.processes
      ?.filter((item: any) => item.type === stage && item.status !== 'Planificada')
      ?.sort((a: any, b: any) => new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime())[0];
    return Boolean(selectedOrder?.[APPROVAL_FIELDS[stage]]) || proc?.status === 'finalizado';
  });

  const canMarkProductFinished = Boolean(
    selectedOrder &&
    selectedOrder.status !== 'Finalizadas' &&
    selectedOrder.status !== 'Entregadas' &&
    allPlannedStagesFinished
  );

  // Synchronize stage inputs with selectedOrder
  useEffect(() => {
    if (!selectedOrder) return;

    const machineId = user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() === activeStage
      ? user.machine.id.toString()
      : (stageProcess?.machineId || plannedStageProcess?.machineId || '')?.toString();

    const nextStageData = {
      ...createInitialStageData(),
      machineId,
      operatorId: stageProcess?.operatorId?.toString?.() || lastStageOperatorId,
      processedMeters: (
        stageProcess?.printingData?.processedMeters ??
        stageProcess?.laminationData?.processedMeters ??
        ''
      ).toString(),
      mixProportion: stageProcess?.laminationData?.mixProportion || '',
      scrapKg: stageProcess?.scrapKg?.toString?.() || '0',
      observations: stageProcess?.observations || '',
      exitSense: activeStage === 'IMPRESION'
        ? (stageProcess?.printingData?.exitSense || selectedOrder.technicalSpec?.printingExitSense || '')
        : (stageProcess?.refiladoData?.exitSense || selectedOrder.technicalSpec?.refiladoExitSense || ''),
      tacaRight: stageProcess?.refiladoData?.tacaRight || '',
      tacaLeft: stageProcess?.refiladoData?.tacaLeft || '',
      dePie: Boolean(stageProcess?.refiladoData?.dePie),
      deCabeza: Boolean(stageProcess?.refiladoData?.deCabeza),
      anchoEspira: stageProcess?.refiladoData?.anchoEspira?.toString?.() || '',
      coilDiameter: (
        stageProcess?.printingData?.coilDiameter ??
        stageProcess?.refiladoData?.coilDiameter ??
        (activeStage === 'IMPRESION' ? selectedOrder.technicalSpec?.printingCoilDiameter : undefined) ??
        ''
      ).toString(),
      coilCount: (
        stageProcess?.printingData?.coilCount ??
        stageProcess?.refiladoData?.coilCount ??
        ''
      ).toString(),
      controlName: stageProcess?.refiladoData?.controlName || '',
      tacaDerIzq: stageProcess?.refiladoData?.tacaDerIzq || '',
      finalAnchoEspira: stageProcess?.refiladoData?.finalAnchoEspira?.toString?.() || '',
      finalExitSense: stageProcess?.refiladoData?.finalExitSense || '',
      bobbinCountName: stageProcess?.refiladoData?.bobbinCountName || ''
    };

    setStageData(nextStageData);

    if (activeStage === 'IMPRESION' || activeStage === 'LAMINACION') {
      setMetricEntries(
        stageProcess?.metricEntries?.length
          ? stageProcess.metricEntries.map((entry: any, index: number) => ({
              meters: entry.meters?.toString?.() ?? '',
              scrapKg: entry.scrapKg?.toString?.() ?? '',
              coilCount: entry.coilCount?.toString?.() ?? '',
              description: entry.description || `Tramo ${index + 1}`
            }))
          : [createInitialMetricEntry()]
      );

      setMaterialLots(
        stageProcess?.materialLots?.length
          ? stageProcess.materialLots.map((lot: any) => ({
              lotNumber: lot.lotNumber || '',
              kg: lot.kg?.toString?.() ?? '',
              initialMeters: lot.initialMeters?.toString?.() ?? '',
              addedMeters: lot.addedMeters?.toString?.() ?? '',
              finalMeters: lot.finalMeters?.toString?.() ?? '',
              observations: lot.observations || ''
            }))
          : [createInitialMaterialLot()]
      );
    }

    if (activeStage === 'REFILADO') {
      setRefiladoOutputBobbins(
        stageProcess?.refiladoData?.outputBobbins?.length
          ? stageProcess.refiladoData.outputBobbins.map((bobbin: any, index: number) => ({
              label: bobbin.label || `Bobina ${index + 1}`,
              productName: bobbin.productName || defaultProductName,
              kg: bobbin.kg?.toString?.() || '',
              notes: bobbin.notes || ''
            }))
          : [{ ...createInitialOutputBobbin(), productName: defaultProductName }]
      );

      setRefiladoScrapEntries(
        stageProcess?.scrapEntries?.length
          ? stageProcess.scrapEntries.map((entry: any, index: number) => ({
              kg: entry.kg?.toString?.() || '',
              description: entry.description || `Scrap ${index + 1}`
            }))
          : [createInitialScrapEntry()]
      );
    }

    if (activeStage === 'CONFECCION') {
      setConfeccionOutputs(
        stageProcess?.confeccionData?.outputs?.length
          ? stageProcess.confeccionData.outputs.map((output: any) => ({
              productId: output.productId?.toString?.() || '',
              productName: output.productName || defaultProductName,
              bagQty: output.bagQty?.toString?.() || '',
              notes: output.notes || ''
            }))
          : [{ ...createInitialConfeccionOutput(), productName: defaultProductName, productId: orderProductOptions[0]?.id || '' }]
      );
    }
  }, [activeStage, defaultProductName, lastStageOperatorId, orderProductOptions, plannedStageProcess?.machineId, selectedOrder, stageProcess, user?.machine?.id, user?.machine?.type, user?.role]);

  // Input Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name } = target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setStageData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleTimeLogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTimeLogData((prev) => ({ ...prev, [name]: value }));
  };

  const updateMaterialLot = (index: number, field: string, value: string) => {
    setMaterialLots((prev) => prev.map((lot, lotIndex) => lotIndex === index ? { ...lot, [field]: value } : lot));
  };
  const addMaterialLot = () => setMaterialLots((prev) => [...prev, createInitialMaterialLot()]);
  const removeMaterialLot = (index: number) => setMaterialLots((prev) => prev.length === 1 ? [createInitialMaterialLot()] : prev.filter((_, i) => i !== index));

  const updateMetricEntry = (index: number, field: string, value: string) => {
    setMetricEntries((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry));
  };
  const addMetricEntry = () => setMetricEntries((prev) => [...prev, createInitialMetricEntry(prev.length + 1)]);
  const removeMetricEntry = (index: number) => setMetricEntries((prev) => prev.length === 1 ? [createInitialMetricEntry()] : prev.filter((_, i) => i !== index));

  // Quick increment helper that updates the target metric entry in place (never auto-saves)
  const applyMetricIncrement = (index: number, field: 'meters' | 'scrapKg', delta: number) => {
    setMetricEntries((prev) => prev.map((entry, i) => {
      if (i !== index) return entry;
      const currentVal = parseFloat(entry[field]) || 0;
      const nextVal = Math.max(0, currentVal + delta);
      return { ...entry, [field]: nextVal.toString() };
    }));
  };

  const updateOutputBobbin = (index: number, field: string, value: string) => {
    setRefiladoOutputBobbins((prev) => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };
  const addOutputBobbin = () => setRefiladoOutputBobbins((prev) => [...prev, { ...createInitialOutputBobbin(prev.length + 1), productName: defaultProductName }]);
  const removeOutputBobbin = (index: number) => setRefiladoOutputBobbins((prev) => prev.length === 1 ? [createInitialOutputBobbin()] : prev.filter((_, i) => i !== index));

  const updateScrapEntry = (index: number, field: string, value: string) => {
    setRefiladoScrapEntries((prev) => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };
  const addScrapEntry = () => setRefiladoScrapEntries((prev) => [...prev, createInitialScrapEntry(prev.length + 1)]);
  const removeScrapEntry = (index: number) => setRefiladoScrapEntries((prev) => prev.length === 1 ? [createInitialScrapEntry()] : prev.filter((_, i) => i !== index));

  const updateConfeccionOutput = (index: number, field: string, value: string) => {
    setConfeccionOutputs((prev) => prev.map((out, i) => i === index ? { ...out, [field]: value } : out));
  };
  const addConfeccionOutput = () => setConfeccionOutputs((prev) => [...prev, { ...createInitialConfeccionOutput(), productName: defaultProductName }]);
  const removeConfeccionOutput = (index: number) => setConfeccionOutputs((prev) => prev.length === 1 ? [createInitialConfeccionOutput()] : prev.filter((_, i) => i !== index));

  // Calculations
  const totalOutputKg = useMemo(() => (
    refiladoOutputBobbins.reduce((acc, b) => acc + (parseFloat(b.kg) || 0), 0)
  ), [refiladoOutputBobbins]);

  const metricTotals = useMemo(() => (
    metricEntries.reduce((acc, entry) => ({
      meters: acc.meters + (parseFloat(entry.meters) || 0),
      scrapKg: acc.scrapKg + (parseFloat(entry.scrapKg) || 0),
      coilCount: acc.coilCount + (parseInt(entry.coilCount, 10) || 0)
    }), { meters: 0, scrapKg: 0, coilCount: 0 })
  ), [metricEntries]);

  const totalRefiladoScrapKg = useMemo(() => (
    refiladoScrapEntries.reduce((acc, entry) => acc + (parseFloat(entry.kg) || 0), 0)
  ), [refiladoScrapEntries]);

  const totalConfeccionBags = useMemo(() => (
    confeccionOutputs.reduce((acc, out) => acc + (parseInt(out.bagQty, 10) || 0), 0)
  ), [confeccionOutputs]);

  // Stage Action (START / FINISH)
  const handleStageAction = async (action: 'START' | 'FINISH') => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de avanzar la etapa.');
      return;
    }
    if (!isStagePlanned) {
      setError(`La etapa ${activeStage.toLowerCase()} no está planificada para esta orden.`);
      return;
    }

    setStageActionInFlight(action);
    setError(null);
    setProcessSuccess(null);

    try {
      await api.post(`/orders/${selectedOrderId}/stage-action`, {
        stage: activeStage,
        action,
        machineId: stageData.machineId || undefined,
        operatorId: stageData.operatorId || undefined
      });
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess(action === 'START'
        ? `${activeStage} iniciada. Estado actualizado a En Proceso.`
        : `${activeStage} terminada con éxito. Ya puede continuar la siguiente etapa.`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo actualizar el estado de la etapa.');
    } finally {
      setStageActionInFlight(null);
      setConfirmModal({ open: false, type: null, title: '', description: '' });
    }
  };

  // Finalize full order
  const handleMarkProductFinished = async () => {
    if (!selectedOrderId) return;
    setStageActionInFlight('FINISH_PRODUCT');
    setError(null);
    setProcessSuccess(null);

    try {
      await api.post(`/orders/${selectedOrderId}/finalize`);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess('Producto terminado registrado correctamente e ingresado al stock disponible.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo marcar producto terminado.');
    } finally {
      setStageActionInFlight(null);
      setConfirmModal({ open: false, type: null, title: '', description: '' });
    }
  };

  // Reopen finished order
  const handleReopenProductFinished = async () => {
    if (!selectedOrderId) return;
    setStageActionInFlight('REOPEN');
    setError(null);
    setProcessSuccess(null);

    try {
      await api.post(`/orders/${selectedOrderId}/reopen`);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess('La orden volvió a estado En Proceso y se revirtió el ingreso de stock.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo volver la orden a en proceso.');
    } finally {
      setStageActionInFlight(null);
      setConfirmModal({ open: false, type: null, title: '', description: '' });
    }
  };

  // Save detailed process data
  const handleSaveProcess = async () => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de registrar la etapa.');
      return;
    }
    if (!stageData.machineId) {
      setError('Debe indicar la máquina de la etapa.');
      return;
    }

    setSaving(true);
    setError(null);
    setProcessSuccess(null);

    try {
      const payload: any = {
        orderId: selectedOrderId,
        type: activeStage,
        machineId: stageData.machineId,
        operatorId: stageData.operatorId || undefined,
        scrapKg: activeStage === 'REFILADO'
          ? totalRefiladoScrapKg
          : canUseOperationalMeters
            ? metricTotals.scrapKg
            : parseFloat(stageData.scrapKg) || 0,
        observations: stageData.observations || undefined
      };

      if (activeStage === 'IMPRESION') {
        payload.printingData = {
          exitSense: stageData.exitSense || undefined,
          processedMeters: metricTotals.meters || (parseFloat(stageData.processedMeters) || 0),
          coilDiameter: parseFloat(stageData.coilDiameter) || undefined,
          coilCount: metricTotals.coilCount || (parseInt(stageData.coilCount, 10) || undefined)
        };
        payload.metricEntries = metricEntries
          .map((entry) => ({
            meters: parseFloat(entry.meters) || 0,
            scrapKg: parseFloat(entry.scrapKg) || 0,
            coilCount: parseInt(entry.coilCount, 10) || 0,
            description: entry.description || undefined
          }))
          .filter((entry) => entry.meters > 0 || entry.scrapKg > 0 || entry.coilCount > 0);

        payload.materialLots = materialLots
          .map((lot) => ({
            lotNumber: lot.lotNumber.trim(),
            kg: parseFloat(lot.kg) || 0,
            initialMeters: parseFloat(lot.initialMeters) || 0,
            addedMeters: parseFloat(lot.addedMeters) || 0,
            finalMeters: parseFloat(lot.finalMeters) || 0,
            observations: lot.observations.trim() || undefined
          }))
          .filter((lot) => lot.lotNumber || lot.kg > 0 || lot.initialMeters > 0 || lot.addedMeters > 0 || lot.finalMeters > 0);
      }

      if (activeStage === 'LAMINACION') {
        payload.laminationData = {
          processedMeters: metricTotals.meters || (parseFloat(stageData.processedMeters) || 0),
          mixProportion: stageData.mixProportion || undefined
        };
        payload.metricEntries = metricEntries
          .map((entry) => ({
            meters: parseFloat(entry.meters) || 0,
            scrapKg: parseFloat(entry.scrapKg) || 0,
            coilCount: parseInt(entry.coilCount, 10) || 0,
            description: entry.description || undefined
          }))
          .filter((entry) => entry.meters > 0 || entry.scrapKg > 0 || entry.coilCount > 0);

        payload.materialLots = materialLots
          .map((lot) => ({
            lotNumber: lot.lotNumber.trim(),
            kg: parseFloat(lot.kg) || 0,
            initialMeters: parseFloat(lot.initialMeters) || 0,
            addedMeters: parseFloat(lot.addedMeters) || 0,
            finalMeters: parseFloat(lot.finalMeters) || 0,
            observations: lot.observations.trim() || undefined
          }))
          .filter((lot) => lot.lotNumber || lot.kg > 0 || lot.initialMeters > 0 || lot.addedMeters > 0 || lot.finalMeters > 0);
      }

      if (activeStage === 'REFILADO') {
        payload.refiladoData = {
          tacaRight: stageData.tacaRight || undefined,
          tacaLeft: stageData.tacaLeft || undefined,
          dePie: Boolean(stageData.dePie),
          deCabeza: Boolean(stageData.deCabeza),
          deTripa: Boolean(stageData.deTripa),
          anchoEspira: parseFloat(stageData.anchoEspira) || undefined,
          coilDiameter: parseFloat(stageData.coilDiameter) || undefined,
          coilCount: parseInt(stageData.coilCount, 10) || undefined,
          controlName: stageData.controlName || undefined,
          tacaDerIzq: stageData.tacaDerIzq || undefined,
          finalAnchoEspira: parseFloat(stageData.finalAnchoEspira) || undefined,
          finalExitSense: stageData.finalExitSense || undefined,
          bobbinCountName: stageData.bobbinCountName || undefined,
          outputBobbins: refiladoOutputBobbins
            .map((b) => ({
              label: b.label || undefined,
              productName: b.productName || undefined,
              kg: parseFloat(b.kg) || 0,
              notes: b.notes || undefined
            }))
            .filter((b) => b.kg > 0 || b.label || b.productName)
        };
        payload.scrapEntries = refiladoScrapEntries
          .map((s) => ({
            kg: parseFloat(s.kg) || 0,
            description: s.description || undefined
          }))
          .filter((s) => s.kg > 0);
      }

      if (activeStage === 'CONFECCION') {
        payload.confeccionData = {
          outputs: confeccionOutputs
            .map((out) => ({
              productId: out.productId ? parseInt(out.productId, 10) : undefined,
              productName: out.productName || undefined,
              bagQty: parseInt(out.bagQty, 10) || 0,
              notes: out.notes || undefined
            }))
            .filter((out) => out.bagQty > 0 || out.productName)
        };
      }

      await api.post('/orders/processes', payload);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess(`Datos de ${activeStage.toLowerCase()} guardados exitosamente.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo guardar los datos de la etapa.');
    } finally {
      setSaving(false);
    }
  };

  // Save Time Log
  const handleSaveTimeLog = async () => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de cargar tiempos.');
      return;
    }
    setSavingTimeLog(true);
    setError(null);

    try {
      await api.post(`/orders/${selectedOrderId}/time-logs`, {
        stage: activeStage,
        ...timeLogData
      });
      await fetchSelectedOrder(selectedOrderId);
      setTimeLogData((prev) => ({
        ...prev,
        description: '',
        startTime: '',
        endTime: ''
      }));
      setProcessSuccess(`Tiempo registrado correctamente para ${activeStage.toLowerCase()}.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo registrar el tiempo.');
    } finally {
      setSavingTimeLog(false);
    }
  };

  // Save Checklist
  const handleSaveChecklist = async () => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de guardar el checklist.');
      return;
    }
    setSavingChecklist(true);
    setError(null);

    try {
      await api.post(`/orders/${selectedOrderId}/checklists`, {
        stage: activeStage,
        operatorId: stageData.operatorId || undefined,
        items: checklistItems
      });
      await fetchSelectedOrder(selectedOrderId);
      setProcessSuccess(`Checklist de ${activeStage.toLowerCase()} guardado con éxito.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar checklist de la etapa.');
    } finally {
      setSavingChecklist(false);
    }
  };

  // Save Quality Control
  const handleSaveQuality = async () => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de guardar el control de calidad.');
      return;
    }
    setSavingQuality(true);
    setError(null);

    try {
      await api.post(`/orders/${selectedOrderId}/quality-controls`, {
        stage: activeStage,
        controlData: {
          status: qualityStatus,
          observations: qualityObservations
        }
      });
      await fetchSelectedOrder(selectedOrderId);
      setProcessSuccess(`Control de calidad de ${activeStage.toLowerCase()} registrado (${qualityStatus}).`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el control de calidad.');
    } finally {
      setSavingQuality(false);
    }
  };

  // Filtered orders for the Work Queue
  const queueOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.map((order) => {
      // Check if order has the activeStage planned
      const orderProcesses = order.processes || [];
      const hasStage = orderProcesses.some((p: any) => p.type === activeStage);
      const isFinishedInStage = Boolean(order[APPROVAL_FIELDS[activeStage]]) ||
        orderProcesses.some((p: any) => p.type === activeStage && p.status === 'finalizado');
      const isInProcessInStage = orderProcesses.some((p: any) => p.type === activeStage && p.status === 'en_proceso');

      let stageStatus: 'IN_PROCESS' | 'PENDING' | 'FINISHED' = 'PENDING';
      if (isFinishedInStage) {
        stageStatus = 'FINISHED';
      } else if (isInProcessInStage) {
        stageStatus = 'IN_PROCESS';
      }

      // Delayed calculation based on actual delivery date
      let isDelayed = false;
      let isUrgent = false;
      if (order.deliveryDate && !isFinishedInStage && order.status !== 'Finalizadas') {
        const dDate = new Date(order.deliveryDate);
        dDate.setHours(0, 0, 0, 0);
        if (dDate < today) {
          isDelayed = true;
        } else {
          const diffDays = Math.round((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) {
            isUrgent = true;
          }
        }
      }

      return {
        ...order,
        hasStage,
        stageStatus,
        isDelayed,
        isUrgent
      };
    }).filter((order) => {
      // If user is locked to a specific machine or machine type:
      if (user?.role === 'MACHINE' && user.machine) {
        // Must belong to this machine type stage
        if (!order.hasStage) return false;
      }

      // Search query filter (Order number, Client, Product)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNum = String(order.orderNumber || '').toLowerCase().includes(query);
        const matchesClient = String(order.client?.name || '').toLowerCase().includes(query);
        const matchesProd = String(order.product?.name || order.products?.[0]?.product?.name || '').toLowerCase().includes(query);
        if (!matchesNum && !matchesClient && !matchesProd) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && order.stageStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, activeStage, user?.machine, user?.role, searchQuery, statusFilter]);

  // Counters for tabs
  const counters = useMemo(() => {
    let inProcess = 0;
    let pending = 0;
    let finished = 0;

    orders.forEach((o) => {
      const procs = o.processes || [];
      const isFinished = Boolean(o[APPROVAL_FIELDS[activeStage]]) || procs.some((p: any) => p.type === activeStage && p.status === 'finalizado');
      const isInProcess = procs.some((p: any) => p.type === activeStage && p.status === 'en_proceso');

      if (isFinished) finished++;
      else if (isInProcess) inProcess++;
      else if (procs.some((p: any) => p.type === activeStage)) pending++;
    });

    return { all: inProcess + pending + finished, inProcess, pending, finished };
  }, [orders, activeStage]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw size={36} className="animate-spin" color="var(--primary)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cargando terminal de planta...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Sincronizando órdenes y máquinas activas</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Industrial Terminal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px -10px rgba(0,0,0,0.6)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
          }}>
            <StageIcon size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                Terminal de Planta
              </h1>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {activeStage}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.15rem 0 0 0' }}>
              {user?.role === 'MACHINE' && user.machine
                ? `Máquina conectada: ${user.machine.name} (${user.machine.type})`
                : 'Bandeja táctil de órdenes y registro de producción por etapa'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await fetchOrders();
              if (selectedOrderId) await fetchSelectedOrder(selectedOrderId);
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.1rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Stage Selector Pills (locked if MACHINE role) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {STAGES.map((stage) => {
          const isSelected = activeStage === stage.key;
          const isLocked = user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() !== stage.key;
          const IconComponent = stage.icon;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => !isLocked && setActiveStage(stage.key)}
              disabled={isLocked}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                textAlign: 'left',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.95))'
                  : 'rgba(30, 41, 59, 0.5)',
                color: isSelected ? 'white' : 'var(--text-muted)',
                opacity: isLocked ? 0.35 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 16px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : 'var(--text-muted)'
              }}>
                <IconComponent size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, opacity: 0.7 }}>
                  ETAPA
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: isSelected ? 'white' : 'var(--text-main)' }}>
                  {stage.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="card" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          borderColor: 'var(--danger)',
          color: 'var(--danger)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {processSuccess && (
        <div className="card" style={{
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          borderColor: 'var(--success)',
          color: 'var(--success)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 700 }}>{processSuccess}</span>
          </div>
          <button type="button" onClick={() => setProcessSuccess(null)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Grid: Work Queue (Left) & Operational Detail (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) minmax(0, 1fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* ===================== WORK QUEUE (Bandeja de Órdenes) ===================== */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 'calc(100vh - 180px)', position: 'sticky', top: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="var(--primary)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Bandeja de Trabajo</h2>
              </div>
              <span style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '999px',
                padding: '0.2rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)'
              }}>
                {queueOrders.length} {queueOrders.length === 1 ? 'orden' : 'órdenes'}
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar orden o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.4rem', fontSize: '0.9rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
              {[
                { key: 'ALL', label: 'Todas', count: counters.all },
                { key: 'IN_PROCESS', label: 'En Proc.', count: counters.inProcess },
                { key: 'PENDING', label: 'Pend.', count: counters.pending },
                { key: 'FINISHED', label: 'Listas', count: counters.finished }
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key as any)}
                  style={{
                    padding: '0.45rem 0.2rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: statusFilter === f.key ? 'var(--primary)' : 'var(--border)',
                    background: statusFilter === f.key ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: statusFilter === f.key ? 'white' : 'var(--text-muted)',
                    textAlign: 'center'
                  }}
                >
                  <div>{f.label}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>({f.count})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            overflowY: 'auto',
            paddingRight: '0.25rem',
            maxHeight: 'calc(100vh - 350px)'
          }}>
            {queueOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                border: '1px dashed var(--border)',
                borderRadius: '12px',
                color: 'var(--text-muted)'
              }}>
                <AlertCircle size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>No hay órdenes disponibles</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {searchQuery ? 'Prueba con otro término de búsqueda' : `No hay órdenes pendientes para ${activeStage}`}
                </p>
              </div>
            ) : (
              queueOrders.map((order) => {
                const isSelected = selectedOrderId === order.id.toString();
                const productName = order.product?.name || order.products?.[0]?.product?.name || 'Producto sin nombre';
                const plannedQtyText = order.plannedQty ? `${order.plannedQty} ${order.unit || ''}` : '-';

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id.toString())}
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : '1px solid var(--border)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(30, 41, 59, 0.85))'
                        : 'rgba(15, 23, 42, 0.65)',
                      boxShadow: isSelected
                        ? '0 0 14px rgba(37, 99, 235, 0.25)'
                        : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top line: Order Number, Delayed/Urgent badge, Stage status badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)' }}>
                          #{order.orderNumber}
                        </span>
                        {order.isDelayed && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.4)'
                          }}>
                            ATRASADA
                          </span>
                        )}
                        {!order.isDelayed && order.isUrgent && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: 'var(--warning)',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          }}>
                            URGENTE
                          </span>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div>
                        {order.stageStatus === 'IN_PROCESS' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: 'rgba(37, 99, 235, 0.2)',
                            color: '#60a5fa',
                            border: '1px solid rgba(37, 99, 235, 0.4)'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60a5fa', animation: 'pulse 2s infinite' }} />
                            EN PROCESO
                          </span>
                        )}
                        {order.stageStatus === 'FINISHED' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: 'var(--success)',
                            border: '1px solid rgba(34, 197, 94, 0.4)'
                          }}>
                            <CheckCircle2 size={12} />
                            LISTA
                          </span>
                        )}
                        {order.stageStatus === 'PENDING' && (
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: 'rgba(148, 163, 184, 0.15)',
                            color: 'var(--text-muted)',
                            border: '1px solid rgba(148, 163, 184, 0.25)'
                          }}>
                            PENDIENTE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Client & Product */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {order.client?.name || 'Cliente sin nombre'}
                      </p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', margin: '0.1rem 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {productName}
                      </p>
                    </div>

                    {/* Metadata Footer: Planned Qty & Delivery Date */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '0.45rem',
                      marginTop: '0.45rem'
                    }}>
                      <span>Plan: <strong style={{ color: 'var(--text-main)' }}>{plannedQtyText}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} />
                        {formatDisplayDate(order.deliveryDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== OPERATIONAL DETAIL (Ficha Operativa) ===================== */}
        <div>
          {!selectedOrder ? (
            <div className="card" style={{
              textAlign: 'center',
              padding: '4.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Layers size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Seleccione una orden de la bandeja
                </h3>
                <p style={{ maxWidth: '420px', marginTop: '0.5rem', fontSize: '0.92rem' }}>
                  Haga toque sobre cualquier tarjeta de la lista izquierda para cargar su ficha técnica, registrar producción, controlar mermas y completar calidad.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Top Operational Status & Main Actions Bar */}
              <div className="card" style={{
                border: isStageInProcess
                  ? '2px solid rgba(37, 99, 235, 0.4)'
                  : isStageFinished
                    ? '2px solid rgba(34, 197, 94, 0.4)'
                    : '1px solid var(--border)',
                background: isStageInProcess
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(15, 23, 42, 0.95))'
                  : 'rgba(30, 41, 59, 0.85)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        Orden #{selectedOrder.orderNumber}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: isStageFinished
                          ? 'rgba(34, 197, 94, 0.2)'
                          : isStageInProcess
                            ? 'rgba(37, 99, 235, 0.25)'
                            : 'rgba(148, 163, 184, 0.18)',
                        color: isStageFinished
                          ? 'var(--success)'
                          : isStageInProcess
                            ? '#60a5fa'
                            : 'var(--text-muted)',
                        border: '1px solid',
                        borderColor: isStageFinished
                          ? 'rgba(34, 197, 94, 0.4)'
                          : isStageInProcess
                            ? 'rgba(37, 99, 235, 0.4)'
                            : 'rgba(148, 163, 184, 0.3)'
                      }}>
                        {isStageFinished
                          ? `ETAPA ${activeStage} FINALIZADA`
                          : isStageInProcess
                            ? `ETAPA ${activeStage} EN PROCESO`
                            : `ETAPA ${activeStage} PENDIENTE`}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
                      Cliente: <strong style={{ color: 'var(--accent)' }}>{selectedOrder.client?.name}</strong> • Producto: <strong style={{ color: 'var(--text-main)' }}>{defaultProductName}</strong>
                    </p>
                  </div>

                  {/* Primary Large Touch Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* START ETAPA */}
                    <button
                      type="button"
                      onClick={() => handleStageAction('START')}
                      disabled={Boolean(stageActionInFlight) || !isStagePlanned || isStageInProcess || isStageFinished || selectedOrder.status === 'Finalizadas'}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.9rem 1.4rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        minHeight: '52px',
                        boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
                      }}
                    >
                      <Play size={20} />
                      <span>{stageActionInFlight === 'START' ? 'Iniciando...' : 'Iniciar Etapa'}</span>
                    </button>

                    {/* FINISH ETAPA (Requires Confirmation) */}
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        open: true,
                        type: 'FINISH_STAGE',
                        title: `Finalizar etapa de ${activeStage}`,
                        description: `¿Confirmas el cierre operativo de la etapa ${activeStage} para la orden #${selectedOrder.orderNumber}? Esta acción registra la finalización y habilita la etapa siguiente.`
                      })}
                      disabled={Boolean(stageActionInFlight) || !isStageInProcess}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.9rem 1.4rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        minHeight: '52px',
                        border: '1px solid var(--success)',
                        color: 'var(--success)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        cursor: isStageInProcess ? 'pointer' : 'not-allowed',
                        opacity: isStageInProcess ? 1 : 0.4
                      }}
                    >
                      <CheckCircle2 size={20} />
                      <span>Finalizar Etapa</span>
                    </button>

                    {/* PRODUCTO TERMINADO (Only when all stages finished) */}
                    <button
                      type="button"
                      onClick={() => setConfirmModal({
                        open: true,
                        type: 'FINISH_PRODUCT',
                        title: 'Confirmar Producto Terminado',
                        description: `¿Marcar la orden #${selectedOrder.orderNumber} como producto terminado? Esto sumará el lote al inventario de producto terminado disponible.`
                      })}
                      disabled={Boolean(stageActionInFlight) || !canMarkProductFinished}
                      title={allPlannedStagesFinished ? 'Marcar producto terminado' : 'Completa todas las etapas planificadas primero'}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.9rem 1.35rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        minHeight: '52px',
                        border: '1px solid #f59e0b',
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.1)',
                        opacity: canMarkProductFinished ? 1 : 0.4,
                        cursor: canMarkProductFinished ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <PackageCheck size={20} />
                      <span>Producto Terminado</span>
                    </button>

                    {/* REOPEN if finished */}
                    {selectedOrder.status === 'Finalizadas' && (
                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          open: true,
                          type: 'REOPEN_PRODUCT',
                          title: 'Reabrir Orden Finalizada',
                          description: `¿Volver la orden #${selectedOrder.orderNumber} a En Proceso? Esto revertirá el stock de producto terminado ingresado.`
                        })}
                        disabled={Boolean(stageActionInFlight)}
                        className="btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.9rem 1.35rem',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          minHeight: '52px',
                          border: '1px solid var(--primary)',
                          color: 'var(--primary)',
                          background: 'rgba(37, 99, 235, 0.1)'
                        }}
                      >
                        <Play size={18} />
                        <span>Volver a En Proceso</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Operational Work */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.5rem',
                overflowX: 'auto'
              }}>
                {[
                  { key: 'METRICS', label: 'Producción & Métricas', icon: Sliders },
                  { key: 'SPECS', label: 'Especificaciones Técnicas', icon: Info },
                  { key: 'TIMES', label: 'Tiempos & Paradas', icon: Clock },
                  { key: 'QUALITY', label: 'Checklist & Calidad', icon: ShieldCheck }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.85rem 1.4rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.02)',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={18} color={isSelected ? 'var(--accent)' : 'currentColor'} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: ESPECIFICACIONES TÉCNICAS */}
              {activeTab === 'SPECS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <FormSection title="Ficha Técnica Operativa" icon={<StageIcon size={22} />}>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Orden</p>
                      <p style={{ fontWeight: 800 }}>{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Cliente</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.client?.name || '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Producto</p>
                      <p style={{ fontWeight: 700 }}>{defaultProductName}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Metros Planificados</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.technicalSpec?.meters || selectedOrder.plannedQty || '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Tipo de Trabajo</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.workType ? String(selectedOrder.workType).replaceAll('_', ' ') : '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Muestra Aprobada</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.hasSample ? 'Sí (Aprobada)' : 'No'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Lámina / Material</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.technicalSpec?.lamina || '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Tubo / Núcleo</p>
                      <p style={{ fontWeight: 700 }}>{selectedOrder.technicalSpec?.tube || 'Sin definir'}</p>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Observaciones de Administración</p>
                      <p style={{ whiteSpace: 'pre-line', background: 'rgba(15, 23, 42, 0.45)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {selectedOrder.specifications || selectedOrder.observations || 'Sin observaciones registradas'}
                      </p>
                    </div>
                  </FormSection>

                  {/* Stage-Specific Technical Specifications */}
                  {activeStage === 'IMPRESION' && (
                    <div className="card">
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={18} color="var(--primary)" />
                        Especificaciones de Impresión
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <DataPill label="Sentido de Salida" value={selectedOrder.technicalSpec?.printingExitSense || stageData.exitSense || '-'} />
                        <DataPill label="Diámetro de Bobina" value={selectedOrder.technicalSpec?.printingCoilDiameter ? `${selectedOrder.technicalSpec.printingCoilDiameter} mm` : '-'} />
                        <DataPill label="Tipo de Impresión" value={selectedOrder.technicalSpec?.printingType || '-'} />
                        <DataPill label="Posición" value={selectedOrder.technicalSpec?.pie ? 'De Pie' : selectedOrder.technicalSpec?.cabeza ? 'De Cabeza' : '-'} />
                        <DataPill label="Taca" value={selectedOrder.technicalSpec?.tacaRight ? 'Derecha' : selectedOrder.technicalSpec?.tacaLeft ? 'Izquierda' : '-'} />
                        <DataPill label="Tratamiento Corona" value={selectedOrder.technicalSpec?.coronaTreatment ? 'Sí' : 'No'} />
                      </div>

                      {/* Color Orders / Anilox Sequence */}
                      {selectedOrder.colorOrders?.length > 0 && (
                        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                          <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                            Secuencia de Colores y Clichés
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                            {selectedOrder.colorOrders.map((co: any, i: number) => (
                              <div key={i} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border)', padding: '0.65rem', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CUERPO {co.order || i + 1}</span>
                                <p style={{ fontWeight: 800, margin: '0.2rem 0 0 0', color: 'var(--accent)' }}>{co.colorName || 'Sin color'}</p>
                                {co.anilox && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Anilox: {co.anilox}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeStage === 'LAMINACION' && (
                    <div className="card">
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Droplets size={18} color="var(--primary)" />
                        Especificaciones de Laminación
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <DataPill label="Estructura / Lámina" value={selectedOrder.technicalSpec?.lamina || '-'} />
                        <DataPill label="Proporción de Mezcla Adhesivo" value={stageData.mixProportion || selectedOrder.technicalSpec?.mixProportion || '-'} />
                        <DataPill label="Diámetro Bobina" value={selectedOrder.technicalSpec?.printingCoilDiameter ? `${selectedOrder.technicalSpec.printingCoilDiameter} mm` : '-'} />
                      </div>
                    </div>
                  )}

                  {activeStage === 'REFILADO' && (
                    <div className="card">
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Scissors size={18} color="var(--primary)" />
                        Especificaciones de Refilado
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                        <DataPill label="Sentido Salida Cliente" value={selectedOrder.technicalSpec?.refiladoExitSense || '-'} />
                        <DataPill label="De Pie" value={selectedOrder.technicalSpec?.refiladoDePie ? 'Sí' : 'No'} />
                        <DataPill label="De Cabeza" value={selectedOrder.technicalSpec?.refiladoDeCabeza ? 'Sí' : 'No'} />
                        <DataPill label="Taca Derecha" value={selectedOrder.technicalSpec?.refiladoTacaRight || '-'} />
                        <DataPill label="Taca Izquierda" value={selectedOrder.technicalSpec?.refiladoTacaLeft || '-'} />
                        <DataPill label="Ancho Espira" value={selectedOrder.technicalSpec?.refiladoAnchoEspira ?? '-'} />
                        <DataPill label="Diámetro Bobinas CMM" value={selectedOrder.technicalSpec?.refiladoCoilDiameter ? `${selectedOrder.technicalSpec.refiladoCoilDiameter} mm` : '-'} />
                        <DataPill label="Metros Refilado" value={selectedOrder.technicalSpec?.refiladoMeters ?? '-'} />
                      </div>
                    </div>
                  )}

                  {activeStage === 'CONFECCION' && (
                    <div className="card">
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PackageCheck size={18} color="var(--primary)" />
                        Especificaciones de Confección
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                        <DataPill label="Tipo de Bolsa / Trabajo" value={selectedOrder.workType ? String(selectedOrder.workType).replaceAll('_', ' ') : '-'} />
                        <DataPill label="Cantidad Estimada" value={selectedOrder.estimatedBagQty ? `${selectedOrder.estimatedBagQty} bolsas` : '-'} />
                        <DataPill label="Muestra" value={selectedOrder.hasSample ? 'Sí (Aprobada)' : 'No'} />
                        <DataPill label="Observaciones" value={selectedOrder.specifications || '-'} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCCIÓN & MÉTRICAS */}
              {activeTab === 'METRICS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <StageIcon size={22} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Registro de Avance: {activeStage}</h3>
                      </div>

                      {/* Quick Summary Pill */}
                      {canUseOperationalMeters && (
                        <div style={{
                          background: 'rgba(37, 99, 235, 0.15)',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          borderRadius: '10px',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          gap: '1.25rem',
                          fontSize: '0.85rem'
                        }}>
                          <span>Metros Totales: <strong style={{ color: '#60a5fa' }}>{metricTotals.meters.toFixed(1)} m</strong></span>
                          <span>Scrap: <strong style={{ color: 'var(--danger)' }}>{metricTotals.scrapKg.toFixed(1)} kg</strong></span>
                          {activeStage === 'IMPRESION' && <span>Bobinas: <strong style={{ color: 'var(--text-main)' }}>{metricTotals.coilCount}</strong></span>}
                        </div>
                      )}
                    </div>

                    {/* Machine & Operator Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label className="label">Máquina Asignada</label>
                        <select
                          name="machineId"
                          value={stageData.machineId}
                          onChange={handleInputChange}
                          className="input"
                          disabled={currentMachineLocked}
                        >
                          <option value="">Seleccionar máquina...</option>
                          {machines
                            .filter((m) => String(m.type).toUpperCase() === activeStage)
                            .map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Operario de Turno</label>
                        <select name="operatorId" value={stageData.operatorId} onChange={handleInputChange} className="input">
                          <option value="">Seleccionar operario...</option>
                          {operators.map((op) => (
                            <option key={op.id} value={op.id}>{op.firstName} {op.lastName}</option>
                          ))}
                        </select>
                      </div>

                      {activeStage === 'IMPRESION' && (
                        <>
                          <div>
                            <label className="label">Sentido de Salida</label>
                            <input name="exitSense" value={stageData.exitSense} onChange={handleInputChange} type="text" className="input" placeholder="Ej: Cliente hacia arriba" />
                          </div>
                          <div>
                            <label className="label">Diámetro Bobina (mm)</label>
                            <input name="coilDiameter" value={stageData.coilDiameter} onChange={handleInputChange} type="number" className="input" />
                          </div>
                        </>
                      )}

                      {activeStage === 'LAMINACION' && (
                        <div>
                          <label className="label">Proporción de Mezcla</label>
                          <input name="mixProportion" value={stageData.mixProportion} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 100:15" />
                        </div>
                      )}
                    </div>

                    {/* METRIC ENTRIES TABLE (Impresión y Laminación) */}
                    {canUseOperationalMeters && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Tramos y Metros Producidos</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                              Carga cada tramo trabajado con sus metros reales, scrap y bobinas.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addMetricEntry}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}
                          >
                            <Plus size={16} />
                            <span>Agregar Tramo</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {metricEntries.map((entry, index) => (
                            <div
                              key={index}
                              style={{
                                background: 'rgba(15, 23, 42, 0.45)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                              }}
                            >
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: activeStage === 'IMPRESION' ? 'repeat(auto-fit, minmax(130px, 1fr)) auto' : 'repeat(auto-fit, minmax(160px, 1fr)) auto',
                                gap: '0.75rem',
                                alignItems: 'end'
                              }}>
                                <div>
                                  <label className="label">Metros Reales</label>
                                  <input
                                    value={entry.meters}
                                    onChange={(e) => updateMetricEntry(index, 'meters', e.target.value)}
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                                  />
                                </div>
                                <div>
                                  <label className="label">Scrap (kg)</label>
                                  <input
                                    value={entry.scrapKg}
                                    onChange={(e) => updateMetricEntry(index, 'scrapKg', e.target.value)}
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                                  />
                                </div>
                                {activeStage === 'IMPRESION' && (
                                  <div>
                                    <label className="label">Cantidad Bobinas</label>
                                    <input
                                      value={entry.coilCount}
                                      onChange={(e) => updateMetricEntry(index, 'coilCount', e.target.value)}
                                      type="number"
                                      className="input"
                                      placeholder="0"
                                      style={{ fontSize: '1.1rem', fontWeight: 800 }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="label">Descripción</label>
                                  <input
                                    value={entry.description}
                                    onChange={(e) => updateMetricEntry(index, 'description', e.target.value)}
                                    className="input"
                                    placeholder={`Tramo ${index + 1}`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMetricEntry(index)}
                                  title="Quitar tramo"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: 'var(--danger)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              {/* Tactile Quick Increment Pills for Metros */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                                  Ajuste rápido metros:
                                </span>
                                {[50, 100, 500, 1000].map((delta) => (
                                  <button
                                    key={delta}
                                    type="button"
                                    onClick={() => applyMetricIncrement(index, 'meters', delta)}
                                    style={{
                                      padding: '0.3rem 0.65rem',
                                      borderRadius: '6px',
                                      background: 'rgba(255,255,255,0.06)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-main)',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    +{delta} m
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MATERIAL LOTS (Impresión y Laminación) */}
                    {canUseMaterialLots && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Lotes y Bobinas Utilizadas</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                              Registro de número de lote, peso en kg y metros cargados en máquina.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={addMaterialLot}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}
                          >
                            <Plus size={16} />
                            <span>Agregar Lote</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {materialLots.map((lot, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto',
                                gap: '0.75rem',
                                alignItems: 'end',
                                background: 'rgba(15, 23, 42, 0.35)',
                                padding: '0.85rem',
                                borderRadius: '10px',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <div>
                                <label className="label">N° Lote / Bobina</label>
                                <input
                                  value={lot.lotNumber}
                                  onChange={(e) => updateMaterialLot(index, 'lotNumber', e.target.value)}
                                  className="input"
                                  placeholder={`Bobina ${index + 1}`}
                                />
                              </div>
                              <div>
                                <label className="label">Kg</label>
                                <input
                                  value={lot.kg}
                                  onChange={(e) => updateMaterialLot(index, 'kg', e.target.value)}
                                  type="number"
                                  className="input"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="label">Metros Iniciales</label>
                                <input
                                  value={lot.initialMeters}
                                  onChange={(e) => updateMaterialLot(index, 'initialMeters', e.target.value)}
                                  type="number"
                                  className="input"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="label">Metros Finales</label>
                                <input
                                  value={lot.finalMeters}
                                  onChange={(e) => updateMaterialLot(index, 'finalMeters', e.target.value)}
                                  type="number"
                                  className="input"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="label">Observaciones</label>
                                <input
                                  value={lot.observations}
                                  onChange={(e) => updateMaterialLot(index, 'observations', e.target.value)}
                                  className="input"
                                  placeholder="Opcional"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMaterialLot(index)}
                                title="Quitar lote"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: 'var(--danger)',
                                  borderRadius: '8px',
                                  padding: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* REFILADO OUTPUTS */}
                    {activeStage === 'REFILADO' && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Bobinas de Salida CMM</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                              Total refilado: <strong style={{ color: 'var(--accent)' }}>{totalOutputKg.toFixed(1)} kg</strong>
                            </p>
                          </div>
                          <button type="button" onClick={addOutputBobbin} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}>
                            <Plus size={16} />
                            <span>Agregar Bobina</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {refiladoOutputBobbins.map((bobbin, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '0.75rem', alignItems: 'end', background: 'rgba(15, 23, 42, 0.35)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div>
                                <label className="label">Etiqueta</label>
                                <input value={bobbin.label} onChange={(e) => updateOutputBobbin(index, 'label', e.target.value)} className="input" />
                              </div>
                              <div>
                                <label className="label">Kg</label>
                                <input value={bobbin.kg} onChange={(e) => updateOutputBobbin(index, 'kg', e.target.value)} type="number" className="input" placeholder="0" />
                              </div>
                              <div>
                                <label className="label">Notas</label>
                                <input value={bobbin.notes} onChange={(e) => updateOutputBobbin(index, 'notes', e.target.value)} className="input" placeholder="Opcional" />
                              </div>
                              <button type="button" onClick={() => removeOutputBobbin(index)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CONFECCION OUTPUTS */}
                    {activeStage === 'CONFECCION' && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Producción de Bolsas Confeccionadas</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                              Total bolsas: <strong style={{ color: 'var(--accent)' }}>{totalConfeccionBags.toLocaleString('es-AR')} bolsas</strong>
                            </p>
                          </div>
                          <button type="button" onClick={addConfeccionOutput} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem' }}>
                            <Plus size={16} />
                            <span>Agregar Producto</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {confeccionOutputs.map((output, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto', gap: '0.75rem', alignItems: 'end', background: 'rgba(15, 23, 42, 0.35)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div>
                                <label className="label">Producto</label>
                                <input value={output.productName} onChange={(e) => updateConfeccionOutput(index, 'productName', e.target.value)} className="input" />
                              </div>
                              <div>
                                <label className="label">Cantidad Bolsas</label>
                                <input value={output.bagQty} onChange={(e) => updateConfeccionOutput(index, 'bagQty', e.target.value)} type="number" className="input" placeholder="0" />
                              </div>
                              <div>
                                <label className="label">Nota</label>
                                <input value={output.notes} onChange={(e) => updateConfeccionOutput(index, 'notes', e.target.value)} className="input" placeholder="Opcional" />
                              </div>
                              <button type="button" onClick={() => removeConfeccionOutput(index)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational Observations */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <label className="label">Observaciones Operativas / Paradas Registradas</label>
                      <textarea
                        name="observations"
                        value={stageData.observations}
                        onChange={handleInputChange}
                        className="input"
                        style={{ minHeight: '90px', resize: 'vertical' }}
                        placeholder="Ej: Cambio de bobina, parada por ajuste de tensión, rotura de cuchilla..."
                      />
                    </div>

                    {/* Save Process Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={handleSaveProcess}
                        disabled={saving || !isStageInProcess}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem 2rem',
                          fontSize: '1rem',
                          fontWeight: 800,
                          minHeight: '52px'
                        }}
                      >
                        {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                        <span>{saving ? 'GUARDANDO REGISTRO...' : 'GUARDAR AVANCE DE ETAPA'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Consumptions block if printing or lamination */}
                  {canUseConsumptions && (
                    <div>
                      {!isStageInProcess ? (
                        <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                          <Info size={20} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                          <p style={{ margin: 0 }}>Para registrar consumos y descontar insumos de stock, primero debe poner la etapa <strong>En Proceso</strong>.</p>
                        </div>
                      ) : (
                        <OrderConsumptions
                          order={selectedOrder}
                          onUpdate={() => fetchSelectedOrder(selectedOrderId)}
                          lockedTab={activeStage === 'IMPRESION' ? 'PRINTING' : 'LAMINATION'}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TIEMPOS & PARADAS */}
              {activeTab === 'TIMES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={22} color="var(--primary)" />
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Horas Trabajadas y Paradas de Máquina</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
                            Registra cada turno, tramo trabajado o motivo de parada técnica.
                          </p>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(37, 99, 235, 0.15)',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        borderRadius: '12px',
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right'
                      }}>
                        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>
                          Total Acumulado Etapa
                        </p>
                        <p style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
                          {formatDuration(currentStageTotalMinutes)}
                        </p>
                      </div>
                    </div>

                    {/* Time log entry inputs */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      background: 'rgba(15, 23, 42, 0.45)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      <div>
                        <label className="label">Operario</label>
                        <select name="operatorId" value={timeLogData.operatorId} onChange={handleTimeLogChange} className="input">
                          <option value="">Seleccionar operario...</option>
                          {operators.map((op) => (
                            <option key={op.id} value={op.id}>{op.firstName} {op.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Fecha</label>
                        <input name="date" type="date" value={timeLogData.date} onChange={handleTimeLogChange} className="input" />
                      </div>
                      <div>
                        <label className="label">Hora Inicio</label>
                        <input name="startTime" type="time" value={timeLogData.startTime} onChange={handleTimeLogChange} className="input" />
                      </div>
                      <div>
                        <label className="label">Hora Fin</label>
                        <input name="endTime" type="time" value={timeLogData.endTime} onChange={handleTimeLogChange} className="input" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="label">Descripción / Motivo de Parada</label>
                        <input
                          name="description"
                          value={timeLogData.description}
                          onChange={handleTimeLogChange}
                          className="input"
                          placeholder="Ej: Producción normal turno mañana / Paro por ajuste de anilox / Cambio de bobina..."
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Duración de esta entrada: <strong style={{ color: currentInputDurationMinutes ? 'var(--accent)' : 'var(--text-muted)' }}>{formatDuration(currentInputDurationMinutes)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveTimeLog}
                        disabled={savingTimeLog || !timeLogData.startTime || !timeLogData.endTime}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.4rem' }}
                      >
                        <Clock size={16} />
                        <span>{savingTimeLog ? 'Guardando...' : 'Guardar Horas / Parada'}</span>
                      </button>
                    </div>

                    {/* Historical logs table */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Historial Registrado de la Etapa</h4>
                      {currentStageLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Todavía no hay eventos o paradas registradas en esta etapa.</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                <th style={{ padding: '0.65rem' }}>Operario</th>
                                <th style={{ padding: '0.65rem' }}>Fecha</th>
                                <th style={{ padding: '0.65rem' }}>Descripción</th>
                                <th style={{ padding: '0.65rem' }}>Inicio</th>
                                <th style={{ padding: '0.65rem' }}>Fin</th>
                                <th style={{ padding: '0.65rem', textAlign: 'right' }}>Duración</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentStageLogs.map((log: any) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>{log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'Sin operario'}</td>
                                  <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{formatDisplayDate(log.date)}</td>
                                  <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{log.description || '-'}</td>
                                  <td style={{ padding: '0.65rem' }}>{formatLogTime(log.startTime)}</td>
                                  <td style={{ padding: '0.65rem' }}>{formatLogTime(log.endTime)}</td>
                                  <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>{formatDuration(getLogDurationMinutes(log))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CHECKLIST & CONTROL DE CALIDAD */}
              {activeTab === 'QUALITY' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {/* Process Checklist */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                      <FileCheck2 size={22} color="var(--primary)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Checklist Operativo</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                      Verificación en máquina antes y durante la tirada. Marca cada parámetro conforme antes de continuar.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {checklistItems.map((item, index) => {
                        const isBoolean = CHECKLIST_BOOLEAN_FIELDS.has(item.controlName);
                        return (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(15, 23, 42, 0.45)',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              gap: '0.85rem'
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                              {item.controlName}
                            </span>

                            {isBoolean ? (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={(e) => {
                                    const next = [...checklistItems];
                                    next[index].checked = e.target.checked;
                                    setChecklistItems(next);
                                  }}
                                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.checked ? 'var(--success)' : 'var(--text-muted)' }}>
                                  {item.checked ? 'OK' : 'Pendiente'}
                                </span>
                              </label>
                            ) : (
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) => {
                                  const next = [...checklistItems];
                                  next[index].value = e.target.value;
                                  setChecklistItems(next);
                                }}
                                className="input"
                                style={{ width: '180px', padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
                                placeholder="Valor / Observación"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={handleSaveChecklist}
                        disabled={savingChecklist}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.4rem' }}
                      >
                        <Save size={16} />
                        <span>{savingChecklist ? 'Guardando...' : 'Guardar Checklist'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quality Control Audit */}
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                      <ShieldCheck size={22} color="var(--success)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Control de Calidad</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                      Dictamen formal de auditoría de la etapa para trazabilidad del lote y liberación.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="label">Dictamen de Calidad</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                          {[
                            { value: 'APROBADO', label: 'Aprobado', color: 'var(--success)' },
                            { value: 'OBSERVADO', label: 'Observado', color: 'var(--warning)' },
                            { value: 'RECHAZADO', label: 'Rechazado', color: 'var(--danger)' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setQualityStatus(opt.value as any)}
                              style={{
                                padding: '0.75rem 0.5rem',
                                borderRadius: '8px',
                                border: qualityStatus === opt.value ? `2px solid ${opt.color}` : '1px solid var(--border)',
                                background: qualityStatus === opt.value ? `${opt.color}22` : 'rgba(15, 23, 42, 0.45)',
                                color: qualityStatus === opt.value ? 'white' : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="label">Observaciones de Auditoría</label>
                        <textarea
                          value={qualityObservations}
                          onChange={(e) => setQualityObservations(e.target.value)}
                          className="input"
                          style={{ minHeight: '120px', resize: 'vertical' }}
                          placeholder="Registra detalles de tonalidad, adherencia, rebobinado, o desviaciones respecto a la muestra aprobada..."
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={handleSaveQuality}
                          disabled={savingQuality}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.4rem' }}
                        >
                          <ShieldCheck size={16} />
                          <span>{savingQuality ? 'Guardando...' : 'Registrar Dictamen'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL (Prevents Accidental Finishes / Closes) */}
      {confirmModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-card)',
            border: '2px solid var(--border)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: confirmModal.type === 'FINISH_STAGE'
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmModal.type === 'FINISH_STAGE' ? 'var(--success)' : 'var(--warning)'
              }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{confirmModal.title}</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {confirmModal.description}
            </p>

            {/* Quick summary verification before confirm */}
            {confirmModal.type === 'FINISH_STAGE' && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Metros registrados: <strong style={{ color: 'white' }}>{metricTotals.meters.toFixed(1)} m</strong></span>
                <span>Scrap: <strong style={{ color: 'var(--danger)' }}>{metricTotals.scrapKg.toFixed(1)} kg</strong></span>
                <span>Tiempo: <strong style={{ color: 'var(--accent)' }}>{formatDuration(currentStageTotalMinutes)}</strong></span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, type: null, title: '', description: '' })}
                className="btn btn-secondary"
                disabled={Boolean(stageActionInFlight)}
                style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'FINISH_STAGE') {
                    handleStageAction('FINISH');
                  } else if (confirmModal.type === 'FINISH_PRODUCT') {
                    handleMarkProductFinished();
                  } else if (confirmModal.type === 'REOPEN_PRODUCT') {
                    handleReopenProductFinished();
                  }
                }}
                disabled={Boolean(stageActionInFlight)}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontWeight: 800,
                  background: confirmModal.type === 'FINISH_STAGE' ? 'var(--success)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {stageActionInFlight ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                <span>{stageActionInFlight ? 'Procesando...' : 'Confirmar Acción'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataPill = ({ label, value }: { label: string; value: any }) => (
  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontWeight: 800, margin: 0, overflowWrap: 'anywhere', color: 'var(--text-main)' }}>{value || '-'}</p>
  </div>
);

export default ProductionProcess;
