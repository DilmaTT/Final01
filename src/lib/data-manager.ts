// src/lib/data-manager.ts

    // --- Data Structure ---
    interface AppData {
      version: number;
      folders: any[];
      actionButtons: any[];
      trainings: any[];
      statistics: any[];
      charts: any[]; // Added charts to AppData
      timestamp: string;
    }

    const APP_DATA_VERSION = 1;

    // --- Helper Functions ---
    const isTauri = (): boolean => '__TAURI__' in window;
    const isCapacitor = (): boolean => !!(window as any).Capacitor?.isNativePlatform();


    /**
     * Gathers all relevant data from localStorage into a single object.
     */
    const gatherData = (): AppData => {
      const folders = JSON.parse(localStorage.getItem('poker-ranges-folders') || '[]');
      const actionButtons = JSON.parse(localStorage.getItem('poker-ranges-actions') || '[]');
      const trainings = JSON.parse(localStorage.getItem('training-sessions') || '[]');
      const statistics = JSON.parse(localStorage.getItem('training-statistics') || '[]');
      const charts = JSON.parse(localStorage.getItem('userCharts') || '[]'); // Retrieve charts using 'userCharts'

      return {
        version: APP_DATA_VERSION,
        folders,
        actionButtons,
        trainings,
        statistics,
        charts, // Include charts in the gathered data
        timestamp: new Date().toISOString(),
      };
    };

    /**
     * Applies imported data to the application and reloads the page.
     */
    const applyData = (data: AppData) => {
      if (!data || !data.version || data.version !== APP_DATA_VERSION) {
        console.error("Invalid or outdated data format.");
        alert("Ошибка: Неверный или устаревший формат файла настроек.");
        return;
      }

      console.log("Applying data. Charts data received:", data.charts); // DEBUG LOG
      localStorage.setItem('poker-ranges-folders', JSON.stringify(data.folders || []));
      localStorage.setItem('poker-ranges-actions', JSON.stringify(data.actionButtons || []));
      localStorage.setItem('training-sessions', JSON.stringify(data.trainings || []));
      localStorage.setItem('training-statistics', JSON.stringify(data.statistics || []));
      localStorage.setItem('userCharts', JSON.stringify(data.charts || [])); // Apply charts data using 'userCharts'
      console.log("Charts data after setting to localStorage:", localStorage.getItem('userCharts')); // DEBUG LOG

      alert("Настройки успешно импортированы! Приложение будет перезагружено.");
      
      // Add a small delay before reloading to ensure localStorage has time to persist,
      // which can be an issue on some mobile WebViews.
      setTimeout(() => {
        window.location.reload();
      }, 250);
    };


    // --- Platform-Specific Export Implementations ---

    const exportForWeb = (appData: AppData) => {
      const dataStr = JSON.stringify(appData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poker-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const exportForTauri = async (appData: AppData) => {
      try {
        const { save } = await import('@tauri-apps/api/dialog');
        const { writeTextFile } = await import('@tauri-apps/api/fs');
        
        const filePath = await save({
          defaultPath: `poker-settings-backup-${new Date().toISOString().split('T')[0]}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (filePath) {
          const dataStr = JSON.stringify(appData, null, 2);
          await writeTextFile(filePath, dataStr);
          alert('Настройки успешно экспортированы!');
        }
      } catch (error) {
        console.error('Failed to export settings via Tauri:', error);
        alert('Ошибка экспорта настроек.');
      }
    };

    const exportForCapacitor = async (appData: AppData) => {
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');

        // Request permissions before attempting to write
        const permissionStatus = await Filesystem.requestPermissions();
        if (permissionStatus.publicStorage !== 'granted') {
          alert('Для экспорта настроек необходимо разрешение на доступ к хранилищу. Пожалуйста, предоставьте его в настройках приложения.');
          return;
        }

        const dataStr = JSON.stringify(appData, null, 2);
        const fileName = `poker-settings-backup-${new Date().toISOString()}.json`;

        await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        
        alert(`Настройки сохранены в папку "Документы" вашего устройства под именем: ${fileName}`);
      } catch (error) {
        console.error('Failed to export settings via Capacitor:', error);
        alert('Ошибка экспорта настроек. Проверьте разрешения приложения.');
      }
    };

    // --- Platform-Specific Import Implementations ---

    const importForWeb = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target?.result as string);
              console.log("Imported file data (before applyData):", data); // DEBUG LOG
              applyData(data);
            } catch (err) {
              console.error("Error parsing JSON file.", err);
              alert("Ошибка: Не удалось прочитать файл. Убедитесь, что это корректный JSON файл.");
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };

    const importForTauri = async () => {
      try {
        const { open } = await import('@tauri-apps/api/dialog');
        const { readTextFile } = await import('@tauri-apps/api/fs');
        
        const selected = await open({
          multiple: false,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (typeof selected === 'string' && selected) {
          const contents = await readTextFile(selected);
          const data = JSON.parse(contents);
          console.log("Imported file data (before applyData):", data); // DEBUG LOG
          applyData(data);
        }
      } catch (error) {
        console.error('Failed to import settings via Tauri:', error);
        alert('Ошибка импорта настроек.');
      }
    };

    const importForCapacitor = () => {
      // Use the same approach as web, as Capacitor runs in a WebView and supports file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target?.result as string);
              console.log("Imported file data (before applyData):", data); // DEBUG LOG
              applyData(data);
            } catch (err) {
              console.error("Error parsing JSON file.", err);
              alert("Ошибка: Не удалось прочитать файл. Убедитесь, что это корректный JSON файл.");
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };


    // --- Public API ---

    export const exportUserSettings = () => {
      const appData = gatherData();
      
      if (isTauri()) {
        exportForTauri(appData);
      } else if (isCapacitor()) {
        exportForCapacitor(appData);
      } else {
        exportForWeb(appData);
      }
    };

    export const importUserSettings = () => {
      if (isTauri()) {
        importForTauri();
      } else if (isCapacitor()) {
        importForCapacitor();
      } else {
        importForWeb();
      }
    };
