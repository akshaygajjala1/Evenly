const API_BASE_URL = __DEV__ ? "http://YOUR_LOCAL_IP:3000" : "https://api.evenly.app";

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  id: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  created_at: string;
  raw_text?: string;
}

export interface ProcessedReceipt {
  receipt: Receipt;
  confidence: number;
}

class BackendService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/test`, { method: "GET" }, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }

  async processReceiptImage(imageUri: string): Promise<Receipt> {
    const formData = new FormData();
    
    // Create a blob from the image URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    formData.append("file", blob, "receipt.jpg");

    try {
      const apiResponse = await this.fetchWithTimeout(`${API_BASE_URL}/process-receipt`, {
        method: "POST",
        body: formData,
      }, 30000);

      if (!apiResponse.ok) {
        throw new Error(`Backend error: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      return result.receipt;
    } catch (error) {
      // Fallback to mock OCR for demo purposes
      console.warn("Backend unavailable, using mock OCR:", error);
      return this.mockOCR(imageUri);
    }
  }

  private mockOCR(imageUri: string): Receipt {
    // Mock receipt data for demo when backend is unavailable
    return {
      id: `mock_${Date.now()}`,
      items: [
        { id: "1", name: "Burger", price: 12.99, quantity: 1 },
        { id: "2", name: "Fries", price: 4.99, quantity: 1 },
        { id: "3", name: "Soda", price: 2.99, quantity: 1 },
      ],
      subtotal: 20.97,
      tax: 1.68,
      tip: 0.00,
      total: 22.65,
      created_at: new Date().toISOString(),
      raw_text: "Mock OCR data for demo",
    };
  }
}

export const backendService = new BackendService();
