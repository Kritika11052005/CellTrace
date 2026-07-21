// CellTrace API Client Service

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getHeaders(authRequired = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authRequired) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Fallback if not JSON
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  // ─── Authentication ───────────────────────────────────────

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await this.handleResponse<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      role: string;
    }>(res);

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_role', data.role);
    }
    return data;
  }

  async register(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await this.handleResponse<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      role: string;
    }>(res);

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_role', data.role);
    }
    return data;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    }
  }

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ id: string; email: string; role: string; created_at: string }>(res);
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  }

  // ─── Batteries ───────────────────────────────────────────

  async getBatteries(search = '', skip = 0, take = 50) {
    const params = new URLSearchParams({
      search,
      skip: skip.toString(),
      take: take.toString(),
    });
    const res = await fetch(`${API_BASE_URL}/batteries?${params}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse<{
      batteries: Array<{
        id: string;
        manufacturer?: string;
        model?: string;
        chemistry?: string;
        nominal_capacity_ah?: number;
        created_at: string;
        prediction_count: number;
        chain_record_count: number;
      }>;
      total: number;
    }>(res);
  }

  async getBattery(id: string) {
    const res = await fetch(`${API_BASE_URL}/batteries/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse<{
      id: string;
      manufacturer?: string;
      model?: string;
      chemistry?: string;
      nominal_capacity_ah?: number;
      created_at: string;
      prediction_count: number;
      chain_record_count: number;
    }>(res);
  }

  async createBattery(data: {
    id: string;
    manufacturer?: string;
    model?: string;
    chemistry?: string;
    nominal_capacity_ah?: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/batteries`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async getBatteryPredictions(batteryId: string) {
    const res = await fetch(`${API_BASE_URL}/batteries/${encodeURIComponent(batteryId)}/predictions`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse<{
      battery_id: string;
      predictions: Array<{
        id: string;
        soh_percent: number;
        rul_cycles?: number;
        rul_fraction?: number;
        has_knee_point?: boolean;
        confidence_range?: {
          soh_low?: number;
          soh_high?: number;
          rul_low?: number;
          rul_high?: number;
        };
        model_version: string;
        report_hash?: string;
        created_at: string;
        chain_status?: string;
      }>;
      total: number;
    }>(res);
  }

  async getBatteryHistory(batteryId: string) {
    const res = await fetch(`${API_BASE_URL}/batteries/${encodeURIComponent(batteryId)}/history`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse<{
      battery_id: string;
      records: Array<{
        id: string;
        tx_hash: string;
        data_hash: string;
        event_type: string;
        block_number?: number;
        chain_timestamp?: string;
        status: string;
        soh_percent?: number;
        created_at: string;
        block_explorer_url?: string;
      }>;
      on_chain_records: Array<{
        data_hash: string;
        timestamp: number;
        event_type: string;
      }>;
      total: number;
    }>(res);
  }

  // ─── Predictions ─────────────────────────────────────────

  async runPrediction(data: {
    battery_id: string;
    cycle_number: number;
    soh_current: number;
    cathode: string;
    early_fade_rate_mean?: number;
    early_fade_rate_std?: number;
    early_fade_rate_min?: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/predictions`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<{
      id: string;
      battery_id: string;
      soh_percent: number;
      rul_cycles?: number;
      rul_fraction?: number;
      has_knee_point?: boolean;
      confidence_range?: Record<string, any>;
      model_version: string;
      report_hash?: string;
      created_at: string;
    }>(res);
  }

  async getPrediction(id: string) {
    const res = await fetch(`${API_BASE_URL}/predictions/${id}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse(res);
  }

  // ─── Chain Actions ───────────────────────────────────────

  async writeToChain(predictionId: string, eventType = 'SOH_UPDATE') {
    const res = await fetch(`${API_BASE_URL}/chain/write`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ prediction_id: predictionId, event_type: eventType }),
    });
    return this.handleResponse<{
      id: string;
      prediction_id: string;
      battery_id: string;
      tx_hash: string;
      contract_address: string;
      data_hash: string;
      event_type: string;
      block_number?: number;
      chain_timestamp?: string;
      status: string;
      created_at: string;
    }>(res);
  }

  // ─── Verification ────────────────────────────────────────

  async verifyReport(batteryId: string, reportData: any) {
    const res = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({
        battery_id: batteryId,
        report_data: reportData,
      }),
    });
    return this.handleResponse<{
      battery_id: string;
      is_match: boolean;
      computed_hash: string;
      on_chain_hash?: string;
      message: string;
      tx_hash?: string;
      block_explorer_url?: string;
    }>(res);
  }

  // ─── Dashboard Stats ─────────────────────────────────────

  async getDashboardStats() {
    // Combine some metadata to show dashboard status metrics
    const batteriesRes = await this.getBatteries('', 0, 1);
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    const health = await healthRes.json();

    return {
      total_batteries: batteriesRes.total,
      db_connected: health.checks.database === 'connected',
      chain_active: health.checks.blockchain === 'available',
      ml_loaded: health.checks.ml_models === 'loaded',
    };
  }
}

export const api = new ApiClient();
