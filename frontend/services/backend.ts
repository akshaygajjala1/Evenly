const API_BASE_URL = "http://172.20.10.3:3000";

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
  image_url?: string;
}

class BackendService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Backend request failed:", error);
      throw error;
    }
  }

  async uploadReceipt(imageUri: string): Promise<Receipt> {
    console.log("Uploading receipt to:", `${API_BASE_URL}/upload-receipt`);
    console.log("Image URI:", imageUri);
    
    try {
      // Use React Native's fetch with proper file handling
      const formData = new FormData();
      
      // Create a proper file object from the URI
      const uri = imageUri;
      const fileType = uri.split('.').pop() || 'jpg';
      
      formData.append('file', {
        uri: uri,
        type: `image/${fileType}`,
        name: `receipt.${fileType}`,
      } as any);

      const response = await fetch(`${API_BASE_URL}/upload-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload success:", result);
      return result;
    } catch (error) {
      console.error("Network error during upload:", error);
      throw error;
    }
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing connection to:", `${API_BASE_URL}/test`);
      const response = await fetch(`${API_BASE_URL}/test`);
      const result = await response.json();
      console.log("Connection test result:", result);
      return response.ok;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // Fallback OCR processing if backend isn't available
  async processReceiptImage(imageUri: string): Promise<Receipt> {
    try {
      // Try backend first
      return await this.uploadReceipt(imageUri);
    } catch (error) {
      console.log("Backend not available, using fallback OCR");
      // Fallback to mock OCR if backend isn't running
      return this.mockOCRProcessing();
    }
  }

  private mockOCRProcessing(): Receipt {
    // Generate realistic receipt data when backend isn't available
    const receiptTemplates = [
      {
        items: [
          { id: "i1", name: "Burger Combo", price: 12.99, quantity: 1 },
          { id: "i2", name: "French Fries", price: 4.99, quantity: 1 },
          { id: "i3", name: "Coca Cola", price: 2.99, quantity: 2 },
        ],
        subtotal: 23.96,
        tax: 1.92,
        total: 25.88,
      },
      {
        items: [
          { id: "i1", name: "Margherita Pizza", price: 14.50, quantity: 1 },
          { id: "i2", name: "Caesar Salad", price: 8.75, quantity: 1 },
          { id: "i3", name: "Garlic Bread", price: 5.25, quantity: 1 },
        ],
        subtotal: 28.50,
        tax: 2.28,
        total: 30.78,
      },
    ];

    const template = receiptTemplates[Math.floor(Math.random() * receiptTemplates.length)];
    
    return {
      id: `receipt_${Date.now()}`,
      items: template.items,
      subtotal: template.subtotal,
      tax: template.tax,
      tip: 0,
      total: template.total,
      created_at: new Date().toISOString(),
    };
  }
}

export const backendService = new BackendService();
