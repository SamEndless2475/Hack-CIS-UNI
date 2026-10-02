import { GoogleGenAI } from "@google/genai";

export class FlyerGeneratorService {
  private static readonly GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
  private static requestCount = 0;

  /**
   * Logger para peticiones a Gemini
   */
  private static logRequest(action: string, details?: any) {
    this.requestCount++;
    const timestamp = new Date().toISOString();
    console.log(`🤖 [Gemini Request #${this.requestCount}] ${timestamp} - ${action}`);
    if (details) {
      console.log('📋 Detalles:', details);
    }
  }

  /**
   * Optimiza una imagen reduciendo su tamaño y calidad
   */
  static async optimizeImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen optimizada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad reducida
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`📉 Imagen optimizada: ${file.size} → ${optimizedFile.size} bytes`);
              resolve(optimizedFile);
            } else {
              reject(new Error('No se pudo optimizar la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convierte un File o Blob a base64
   */
  static async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtiene el template del flyer como base64
   */
  static async getFlyerTemplateAsBase64(templatePath: string = '/flyer-template-hack-cis.jpg'): Promise<string> {
    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`No se pudo cargar el template: ${response.statusText}`);
      }

      const blob = await response.blob();
      return await this.fileToBase64(blob);
    } catch (error) {
      console.error('Error cargando template:', error);
      throw new Error('No se pudo cargar el template del flyer. Asegúrate de que el archivo flyer-template-hack-cis.jpg esté en la carpeta public/');
    }
  }

  /**
   * Sistema de backoff exponencial para reintentos
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Genera el flyer personalizado usando Gemini para fusionar las imágenes
   */
  static async generatePersonalizedFlyer(
    userPhoto: File,
    participantName: string = ''
  ): Promise<string> {
    // Verificar si la API key está configurada
    if (!this.GEMINI_API_KEY) {
      throw new Error('⚠️ Google Generative AI API key no configurada. Por favor configura tu API key en las variables de entorno.');
    }

    console.log('🚀 Iniciando generación de flyer personalizado...');

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      console.log(`📡 Intento ${attempt}/${maxRetries}...`);

      try {
        // Paso 1: Optimizar imagen del usuario
        console.log('Paso 1: Optimizando imagen...');
        const optimizedPhoto = await this.optimizeImage(userPhoto, 800, 0.7);

        // Paso 2: Convertir imágenes a base64
        console.log('Paso 2: Convirtiendo imágenes...');
        const userPhotoBase64 = await this.fileToBase64(optimizedPhoto);
        const flyerTemplateBase64 = await this.getFlyerTemplateAsBase64();

        // Paso 3: Usar Gemini para fusionar las imágenes
        console.log('Paso 3: Generando flyer con IA...');

        // Log de la petición
        this.logRequest('Iniciando generación de flyer', {
          attempt: attempt,
          participantName: participantName,
          photoSize: optimizedPhoto.size,
          photoType: optimizedPhoto.type
        });

        const ai = new GoogleGenAI({
          apiKey: this.GEMINI_API_KEY
        });

        const prompt = [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: flyerTemplateBase64,
            },
          },
          {
            inlineData: {
              mimeType: optimizedPhoto.type || "image/jpeg",
              data: userPhotoBase64,
            },
          },
          {
            text: `Create a professional personalized flyer for Hack[CIS] 2026. Use the flyer template from the first image as the base, and seamlessly integrate the person's photo from the second image into it.  

Instructions:
- Final format must be 4:5 aspect ratio, optimized for social media.
- Use the flyer template from the first image as the background design.
- Remove the background from the second image automatically, keeping only the person.
- Place the person naturally and proportionally in the central area of the flyer.
- Apply a soft blur/fade effect at the bottom of the person so they blend smoothly with the template.
- Preserve all original template elements (logos, text, colors, and design).
- Ensure the integration looks professional, realistic, and high-quality.
- Output must be one final flyer image, ready to share on social media.

${participantName ? `Include the participant's name: ${participantName}` : ''}`
          },
        ];

        // Log del prompt enviado
        const textPrompt = prompt.find(item => 'text' in item);
        this.logRequest('Enviando prompt a Gemini', {
          model: "gemini-2.5-flash-image",
          promptLength: textPrompt?.text?.length || 0,
          imagesCount: 2
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image", // Modelo oficial de generación y edición de imágenes
          contents: prompt,
        });

        // Log de la respuesta
        this.logRequest('Respuesta recibida de Gemini', {
          candidatesCount: response.candidates?.length || 0,
          hasContent: !!response.candidates?.[0]?.content
        });

        // Procesar la respuesta
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const imageData = part.inlineData.data;

              // Convertir base64 a blob URL para mostrar
              const buffer = Uint8Array.from(atob(imageData), (c: string) => c.charCodeAt(0));
              const blob = new Blob([buffer], { type: 'image/png' });
              const url = URL.createObjectURL(blob);

              this.logRequest('Flyer generado exitosamente', {
                blobSize: blob.size,
                attempt: attempt
              });

              console.log('✅ Flyer generado exitosamente');
              return url;
            }
          }
        }

        throw new Error('No se recibió imagen en la respuesta de Gemini');

      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);

        // Log del error
        this.logRequest(`Error en intento ${attempt}`, {
          error: error instanceof Error ? error.message : 'Error desconocido',
          attempt: attempt,
          maxRetries: maxRetries
        });

        // Si hay error de cuota o límite en Gemini, usar el motor de composición Canvas
        if (error instanceof Error &&
          (error.message.includes('quota') ||
            error.message.includes('RESOURCE_EXHAUSTED') ||
            error.message.includes('429') ||
            error.message.includes('not found') ||
            error.message.includes('404'))) {
          console.log('⚡ Usando motor de renderizado Canvas para generar flyer instantáneo...');
          return await this.generateCanvasFlyer(userPhoto, participantName);
        }

        // Si no es el último intento, continuar (para otros tipos de errores)
        if (attempt < maxRetries) {
          console.log(`🔄 Reintentando... (${attempt}/${maxRetries})`);
          continue;
        }

        // Si fallaron los reintentos, generar con Canvas como fallback garantizado
        console.log('🎨 Fallback automático a composición Canvas de alta fidelidad');
        return await this.generateCanvasFlyer(userPhoto, participantName);
      }
    }

    return await this.generateCanvasFlyer(userPhoto, participantName);
  }

  /**
   * Generador de composición Canvas de alta resolución
   */
  static async generateCanvasFlyer(userPhoto: File, participantName: string = ''): Promise<string> {
    return new Promise((resolve, reject) => {
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      templateImg.onload = () => {
        const photoImg = new Image();
        photoImg.crossOrigin = 'anonymous';
        photoImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = templateImg.naturalWidth || 1080;
          canvas.height = templateImg.naturalHeight || 1350;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('No se pudo inicializar canvas'));
          }

          // 1. Dibujar template de fondo
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

          // 2. Calcular posición y tamaño para la foto del participante
          const photoAspectRatio = photoImg.naturalWidth / photoImg.naturalHeight;
          const targetHeight = canvas.height * 0.48;
          const targetWidth = targetHeight * photoAspectRatio;
          const posX = (canvas.width - targetWidth) / 2;
          const posY = canvas.height * 0.24;

          // Crear canvas temporal para la foto con degradado/fade inferior
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = targetWidth;
          tempCanvas.height = targetHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(photoImg, 0, 0, targetWidth, targetHeight);
            
            // Aplicar máscara de desvanecimiento suave en la parte inferior
            tempCtx.globalCompositeOperation = 'destination-out';
            const grad = tempCtx.createLinearGradient(0, targetHeight * 0.65, 0, targetHeight);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,1)');
            tempCtx.fillStyle = grad;
            tempCtx.fillRect(0, targetHeight * 0.65, targetWidth, targetHeight * 0.35);
            
            // Dibujar foto procesada en el flyer
            ctx.drawImage(tempCanvas, posX, posY);
          } else {
            ctx.drawImage(photoImg, posX, posY, targetWidth, targetHeight);
          }

          // 3. Dibujar nombre del participante si existe
          if (participantName && participantName.trim()) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 36px system-ui, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 240, 255, 0.9)';
            ctx.shadowBlur = 15;
            ctx.fillText(participantName.toUpperCase(), canvas.width / 2, canvas.height * 0.77);
          }

          canvas.toBlob((blob) => {
            if (blob) {
              console.log('✅ Flyer generado con éxito mediante Canvas');
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('No se pudo generar imagen final'));
            }
          }, 'image/png');
        };
        photoImg.onerror = () => reject(new Error('Error al cargar la foto del participante'));
        photoImg.src = URL.createObjectURL(userPhoto);
      };
      templateImg.onerror = () => reject(new Error('Error al cargar el template del flyer'));
      templateImg.src = '/flyer-template-hack-cis.jpg';
    });
  }

  /**
   * Descargar la imagen generada
   */
  static async downloadFlyer(imageUrl: string, fileName: string = 'hack-cis-flyer.png'): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando flyer:', error);
      throw new Error('No se pudo descargar el flyer');
    }
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  static isConfigured(): boolean {
    return !!this.GEMINI_API_KEY;
  }

  /**
   * Obtener estadísticas de uso
   */
  static getUsageStats() {
    return {
      totalRequests: this.requestCount,
      isConfigured: this.isConfigured(),
      apiKeyPresent: !!this.GEMINI_API_KEY
    };
  }

  /**
   * Resetear contador de peticiones
   */
  static resetStats() {
    this.requestCount = 0;
    console.log('📊 Estadísticas de uso reseteadas');
  }
}