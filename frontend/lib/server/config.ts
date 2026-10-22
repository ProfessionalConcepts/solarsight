export interface SolarAppConfig {
  tariff_domestic_effective_ksh_per_kwh: number
  tariff_small_commercial_effective_ksh_per_kwh: number
  tariff_commercial_effective_ksh_per_kwh: number
  diesel_price_ksh_per_litre: number
  genset_litres_per_kwh: number
  genset_maintenance_ksh_per_kwh: number
  pv_cost_ksh_per_kwp_installed: number
  battery_cost_ksh_per_kwh_installed: number
  panel_m2_per_kwp: number
  self_consumption_with_battery: number
  self_consumption_grid_tie: number
  battery_dod: number
  battery_replacement_year: number
  evening_peak_factor: number
  discount_rate: number
  pvgis_system_loss_pct: number
  sizing_headroom: number
  standard_kit_sizes_kwp: number[]
  battery_kit_sizes_kwh: number[]
  min_bill_for_recommendation_ksh: number
  data_last_updated: string
  [key: string]: any
}

export const DEFAULT_CONFIGS: SolarAppConfig = {
  tariff_domestic_effective_ksh_per_kwh: 19.5,
  tariff_small_commercial_effective_ksh_per_kwh: 22.0,
  tariff_commercial_effective_ksh_per_kwh: 24.0,
  diesel_price_ksh_per_litre: 189,
  genset_litres_per_kwh: 0.4,
  genset_maintenance_ksh_per_kwh: 8,
  pv_cost_ksh_per_kwp_installed: 130000,
  battery_cost_ksh_per_kwh_installed: 85000,
  panel_m2_per_kwp: 5.0,
  self_consumption_with_battery: 0.75,
  self_consumption_grid_tie: 0.55,
  battery_dod: 0.9,
  battery_replacement_year: 11,
  evening_peak_factor: 1.5,
  discount_rate: 0.08,
  pvgis_system_loss_pct: 14,
  sizing_headroom: 1.10,
  standard_kit_sizes_kwp: [0.5, 1, 1.5, 2, 3, 5, 8, 10, 15, 20],
  battery_kit_sizes_kwh: [2.5, 5, 7.5, 10, 15],
  min_bill_for_recommendation_ksh: 3000,
  data_last_updated: '2025-06-01',
}
