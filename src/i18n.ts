import { createI18n } from 'vue-i18n';

const messages = {
  es: {
    common: {
      menu: 'Menu',
      back: 'Volver',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      update: 'Actualizar',
      delete: 'Eliminar',
      edit: 'Editar',
      loading: 'Cargando...',
      retry: 'Reintentar',
      close: 'Cerrar',
      logoAlt: 'Logo de PlantCare'
    },
    errors: {
      notAuthenticated: 'Usuario no autenticado.',
      notAuthenticatedLogin: 'Usuario no autenticado. Inicia sesion.',
      dashboardLoad: 'No se pudo cargar el dashboard.',
      analyticsLoad: 'No se pudieron cargar las analiticas.'
    },
    header: {
      greeting: 'Hola, {name}',
      subtitle: 'listo para explorar el lado verde',
      theme: {
        dark: 'Oscuro',
        light: 'Claro'
      }
    },
    sidebar: {
      nav: {
        dashboard: 'Dashboard',
        plants: 'Plantas',
        settings: 'Configuracion',
        profile: 'Perfil',
        analytics: 'Analiticas'
      },
      status: {
        signedIn: 'Conectado',
        signedOut: 'Desconectado'
      },
      logout: 'Cerrar sesion',
      guest: 'Invitado'
    },
    settings: {
      title: 'Configuracion',
      appearance: {
        title: 'Apariencia',
        description: 'Elige el tema preferido para la aplicacion.',
        light: 'Claro',
        dark: 'Oscuro',
        system: 'Sistema'
      },
      language: {
        title: 'Idioma',
        description: 'Selecciona tu idioma preferido.'
      },
      notifications: {
        title: 'Notificaciones',
        watering: {
          title: 'Recordatorios de riego',
          description: 'Recibe avisos cuando sea hora de regar tus plantas'
        },
        humidity: {
          title: 'Alertas de baja humedad',
          description: 'Recibe alertas cuando la humedad baje del nivel seguro'
        },
        weekly: {
          title: 'Reportes semanales',
          description: 'Recibe resumentes semanales de salud por email'
        },
        push: {
          title: 'Notificaciones push',
          description: 'Activa notificaciones del navegador en tiempo real'
        }
      },
      account: {
        title: 'Cuenta',
        email: 'Correo',
        userId: 'ID de usuario'
      },
      danger: {
        title: 'Zona de riesgo',
        clearTitle: 'Borrar datos de la app',
        clearDesc: 'Elimina preferencias y cache local. Tu cuenta no se elimina.',
        clearButton: 'Borrar datos',
        signOutTitle: 'Cerrar sesion',
        signOutDesc: 'Cierra tu sesion en este dispositivo.',
        signOutButton: 'Cerrar sesion',
        cancel: 'Cancelar',
        confirm: 'Confirmar'
      },
      toast: {
        cleared: 'Datos locales borrados correctamente'
      }
    },
    dashboard: {
      loading: 'Sincronizando el tablero...',
      nextPlant: 'Siguiente planta a regar',
      waterNow: 'Regar ahora',
      recentActivity: 'Actividad reciente',
      viewAll: 'Ver todo',
      stats: {
        totalPlants: 'Total de plantas',
        activeAlerts: 'Alertas activas',
        avgHumidity: 'Humedad promedio',
        healthScore: 'Puntaje de salud',
        excellent: 'Excelente'
      },
      activity: {
        wateredTitle: 'Regaste {name}',
        description: 'Tarea de riego completada'
      },
      due: {
        overdueHours: 'Atrasado por {hours}h',
        overdueDays: 'Atrasado por {days}d',
        dueHours: 'Vence en {hours}h',
        dueDays: 'Vence en {days}d',
        lastWateredHours: 'Regada hace {hours}h',
        lastWateredDays: 'Regada hace {days}d',
        needsReview: 'Necesita revision'
      },
      noLocation: 'Sin ubicacion'
    },
    analytics: {
      header: {
        eyebrow: 'Dashboard',
        title: 'Analiticas y reportes',
        subtitle: 'Sigue el rendimiento y las tendencias de crecimiento'
      },
      badge: {
        last30Days: 'Ultimos 30 dias'
      },
      loading: 'Sincronizando datos del sensor...',
      error: {
        title: 'No se pudo cargar analiticas',
        retry: 'Reintentar'
      },
      empty: {
        noPlants: {
          title: 'Aun no hay plantas',
          subtitle: 'Agrega tu primera planta para empezar a medir su crecimiento y salud.',
          cta: 'Agregar mi primera planta'
        },
        noData: {
          title: 'Esperando datos...',
          subtitle: 'Tus plantas estan agregadas, pero aun no recibimos datos de sensores.',
          hint: 'Las analiticas apareceran cuando los sensores empiecen a transmitir.'
        },
        noHistory: {
          title: 'No hay historico disponible',
          subtitle: 'El historico aparecera cuando se registren datos de sensores.'
        }
      },
      stats: {
        totalPlants: 'Total de plantas',
        healthyPlants: 'Plantas saludables',
        avgHumidity: 'Humedad promedio',
        avgSoilMoisture: 'Humedad del suelo promedio',
        needAttention: 'Requieren atencion',
        trendMonth: '+2 este mes',
        healthRate: '{rate}% de salud',
        ambientLevel: 'Nivel ambiente',
        readings: '{count} lecturas',
        vsYesterday: '-1 vs ayer'
      },
      section: {
        sensor: 'Sensor',
        overview: 'Resumen',
        history: 'Historial'
      },
      charts: {
        temperatureTitle: 'Tendencia de temperatura',
        temperatureSub: 'Promedio de temperatura en todas las plantas',
        humidityTitle: 'Tendencia de humedad',
        humiditySub: 'Promedio de humedad en todas las plantas',
        healthTitle: 'Distribucion de salud de plantas',
        healthSub: 'Estado actual de todas tus plantas',
        soilTitle: 'Humedad del suelo',
        soilSub: 'Nivel promedio de humedad del suelo',
        soilLabel: 'Humedad del suelo',
        soilReadings: '{count} lecturas totales',
        soilOptimal: 'Optimo: 40-60%',
        lightTitle: 'Nivel de luz',
        lightSub: 'Intensidad promedio de luz',
        lightLabel: 'Nivel de luz',
        lightAverage: 'Intensidad promedio',
        historicalTitle: 'Analiticas historicas',
        historicalSub: 'Promedio de las ultimas 5 lecturas',
        refresh: 'Actualizar'
      },
      legend: {
        healthy: 'Saludable',
        warning: 'Atencion',
        critical: 'Critico'
      },
      historical: {
        temperature: 'Temperatura',
        humidity: 'Humedad',
        soilMoisture: 'Humedad del suelo',
        lightLevel: 'Nivel de luz',
        lastReadings: 'Ultimas {count} lecturas',
        averageLevel: 'Nivel promedio',
        period: 'Periodo: {start} – {end}'
      },
      days: {
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mie',
        thu: 'Jue',
        fri: 'Vie',
        sat: 'Sab',
        sun: 'Dom'
      }
    },
    plants: {
      hero: {
        eyebrow: 'Insights de plantas',
        title: 'Tu invernadero',
        subtitle: 'Monitorea salud, riego y mantene tu espacio verde en forma.'
      },
      search: {
        placeholder: 'Buscar por nombre o tipo...',
        aria: 'Buscar plantas'
      },
      addPlant: 'Agregar planta',
      filters: {
        aria: 'Filtrar por estado',
        all: 'Todas las plantas',
        healthy: 'Saludables',
        warning: 'Atencion',
        critical: 'Criticas'
      },
      menu: {
        edit: 'Editar',
        delete: 'Eliminar'
      },
      confirm: {
        deleteMessage: 'Eliminar "{name}"? Esto no se puede deshacer.',
        deleteHeader: 'Confirmar eliminacion'
      },
      toast: {
        deleted: 'Eliminado',
        plantRemoved: 'Planta eliminada',
        error: 'Error',
        couldNotDelete: 'No se pudo eliminar la planta'
      },
      card: {
        view: 'Ver {name}',
        options: 'Opciones',
        humidity: 'Humedad',
        lastWatered: 'Ultimo riego'
      },
      status: {
        healthy: 'Saludable',
        warning: 'Atencion',
        critical: 'Critico'
      },
      empty: {
        title: 'No se encontraron plantas',
        descAll: 'Agrega tu primera planta para comenzar a monitorear.',
        descFiltered: 'No hay plantas con estado "{status}".',
        addFirst: 'Agregar mi primera planta'
      }
    },
    plantDetail: {
      loading: 'Sincronizando datos del sensor...',
      back: 'Plantas',
      backAria: 'Volver a plantas',
      live: 'En vivo',
      connectedProfile: 'Perfil conectado',
      section: {
        liveTelemetry: 'Telemetria en vivo',
        environmentSnapshot: 'Resumen del entorno'
      },
      metric: {
        temperature: 'Temperatura',
        airHumidity: 'Humedad del aire',
        light: 'Luz',
        soilHumidity: 'Humedad del suelo'
      },
      watering: {
        title: 'Horario de riego',
        nextUp: 'Proximo',
        lastWatered: 'Ultimo riego',
        nextWatering: 'Proximo riego',
        button: 'Regar planta',
        buttonLoading: 'Regando...'
      },
      delete: 'Eliminar planta',
      notFound: {
        title: 'Planta no encontrada',
        desc: 'El ID indicado no corresponde a ninguna planta registrada.',
        back: 'Volver a plantas'
      },
      toast: {
        success: 'Exito',
        waterSuccess: '💧 Planta regada correctamente',
        error: 'Error',
        waterFail: 'No se pudo regar la planta',
        deleteSuccess: 'Planta eliminada correctamente',
        deleteFail: 'Hubo un error al eliminar la planta',
        cancelled: 'Cancelado',
        deleteCancelled: 'Eliminacion cancelada'
      },
      confirm: {
        deleteMessage: 'Seguro que deseas eliminar esta planta? Esta accion no se puede deshacer.',
        deleteHeader: 'Confirmar eliminacion'
      }
    },
    plantAnalytics: {
      title: '📊 Analiticas de riego',
      stats: {
        totalWaterings: 'Riegos totales',
        daysBetween: 'Dias entre riegos',
        successRate: 'Tasa de exito',
        daysWithoutWater: 'Dias sin riego'
      },
      logs: {
        title: '🕐 Registros recientes',
        latest: 'Ultimo',
        empty: 'Aun no hay registros de riego. Presiona "Regar ahora" para crear el primero. 💧'
      },
      summary: {
        title: '📋 Resumen',
        thisWeek: 'riegos esta semana',
        thisMonth: 'riegos este mes'
      },
      time: {
        today: 'Hoy',
        yesterday: 'Ayer',
        daysAgo: 'Hace {count} dias',
        weeksAgo: 'Hace {count} semanas',
        monthsAgo: 'Hace {count} meses'
      }
    },
    health: {
      details: {
        soilVeryDry: '🚨 Suelo muy seco ({value}%)',
        soilDry: '⚠️ Suelo seco ({value}%)',
        soilTooWet: '⚠️ Suelo muy humedo ({value}%)',
        tempExtreme: '🚨 Temperatura extrema ({value}°C)',
        tempSuboptimal: '⚠️ Temperatura suboptima ({value}°C)',
        lowLight: '💡 Poca luz ({value} lux)',
        humidityExtreme: '💧 Humedad extrema ({value}%)',
        lowBattery: '🔋 Bateria baja ({value}%)',
        allOptimal: '✅ Todas las condiciones son optimas'
      }
    },
    plantForm: {
      back: 'Volver a plantas',
      eyebrow: 'Perfil de planta',
      titleEdit: 'Editar planta',
      titleAdd: 'Agregar planta',
      statusEditing: 'Editando registro',
      statusNew: 'Nuevo registro',
      field: {
        name: 'Nombre',
        type: 'Tipo',
        image: 'URL de imagen',
        location: 'Ubicacion',
        bio: 'Descripcion'
      },
      placeholder: {
        name: 'Ej. Monstera Deliciosa',
        type: 'Ej. Tropical, Suculenta',
        image: 'https://...',
        location: 'Ej. Sala',
        bio: 'Describe tu planta...'
      },
      hint: {
        image: 'Puedes pegar una URL de imagen de la web.'
      },
      error: {
        nameRequired: 'El nombre es obligatorio',
        typeRequired: 'El tipo es obligatorio',
        loadFailed: 'No se pudieron cargar los detalles de la planta.',
        mustSignIn: 'Debes iniciar sesion para crear una planta. Redirigiendo...',
        noUserId: 'No se encontro un userId para asociar la planta.',
        sessionExpired: 'Sesion expirada. Inicia sesion nuevamente.',
        noPermission: 'No tienes permiso para crear plantas.',
        invalidData: 'Datos invalidos',
        unknown: 'Error desconocido',
        validation: 'Error de validacion: {message}',
        generic: 'Error: {message}'
      },
      action: {
        reset: 'Reiniciar',
        update: 'Actualizar planta',
        save: 'Guardar planta'
      }
    },
    auth: {
      form: {
        email: 'Email',
        password: 'Contrasena',
        emailPlaceholder: 'Ingresa tu email',
        passwordPlaceholder: 'Ingresa tu contrasena',
        submit: 'Ingresar',
        loading: 'Cargando...'
      },
      login: {
        brandTitle: 'PlantCare',
        headline: 'Cuidado inteligente de plantas, reinventado.',
        description: 'Accede a tu panel con una experiencia limpia, segura y futurista.',
        secure: 'Seguro',
        secureDesc: 'Inicio protegido',
        fast: 'Rapido',
        fastDesc: 'Acceso fluido',
        modern: 'Moderno',
        modernDesc: 'Interfaz minimalista',
        welcome: 'Bienvenido de nuevo',
        subtitle: 'Ingresa tus credenciales para iniciar sesion',
        noAccount: 'No tienes cuenta?',
        createNow: 'Crea una ahora'
      },
      signup: {
        eyebrow: 'Acceso seguro PlantCare',
        title: 'Crear cuenta',
        subtitle: 'Unete y comienza tu viaje de cuidado de plantas',
        emailLabel: 'Correo',
        passwordLabel: 'Contrasena',
        confirmLabel: 'Confirmar contrasena',
        emailPlaceholder: "tu{'@'}email.com",
        passwordPlaceholder: 'Minimo 8 caracteres con mayusculas, minusculas, numero y simbolo',
        confirmPlaceholder: 'Reingresa tu contrasena',
        emailRequired: 'El email es obligatorio.',
        emailInvalid: 'Ingresa un email valido.',
        passwordRequired: 'La contrasena es obligatoria.',
        passwordInvalid: 'La contrasena debe incluir: {issues}.',
        confirmRequired: 'Confirma tu contrasena.',
        passwordMismatch: 'Las contrasenas no coinciden.',
        passwordsMatch: 'Las contrasenas coinciden',
        strengthLabel: 'Fortaleza',
        strengthWeak: 'Debil',
        strengthGood: 'Buena',
        strengthStrong: 'Fuerte',
        missing: 'Falta:',
        requirementsMet: 'La contrasena cumple los requisitos',
        requirements: {
          minLength: 'Al menos 8 caracteres',
          lowercase: 'Minuscula',
          uppercase: 'Mayuscula',
          number: 'Numero',
          symbol: 'Caracter especial'
        },
        register: 'Registrar',
        creating: 'Creando cuenta...',
        haveAccount: 'Ya tienes cuenta?',
        signInHere: 'Inicia sesion aqui',
        waitBeforeRetry: 'Espera antes de intentar de nuevo.',
        allFieldsRequired: 'Todos los campos son obligatorios.',
        invalidEmail: 'Ingresa un email valido.',
        passwordMustInclude: 'La contrasena debe incluir: {issues}.',
        registrationFailed: 'No se pudo registrar. Intenta de nuevo.',
        emailRegistered: 'Este email ya esta registrado. Inicia sesion.',
        invalidEmailFormat: 'Formato de email invalido.',
        toast: {
          checkInbox: 'Revisa tu correo',
          accountCreated: 'Cuenta creada. Confirma tu email antes de iniciar sesion.',
          success: 'Exito',
          redirectSetup: 'Cuenta creada. Redirigiendo a configuracion...',
          error: 'Error'
        }
      },
      supabase: {
        signIn: 'Iniciar sesion',
        signUp: 'Registrarse',
        enter: 'Entrar',
        welcome: 'Bienvenido, {email}',
        signOut: 'Cerrar sesion'
      },
      authMenu: {
        welcome: 'Bienvenido',
        signOut: 'Cerrar sesion',
        signIn: 'Iniciar sesion',
        signUp: 'Registrarse',
        guest: 'Invitado'
      }
    },
    profile: {
      loading: 'Cargando perfil...',
      error: 'Error al cargar perfil: {error}',
      changePhoto: 'Cambiar foto',
      eyebrow: 'Cuidador de plantas',
      joined: 'Se unio',
      noLocation: 'Sin ubicacion',
      noBio: 'Sin biografia aun.',
      editProfile: 'Editar perfil',
      stats: {
        totalPlants: 'Total de plantas',
        wateringSessions: 'Sesiones de riego',
        memberSince: 'Miembro desde',
        successRate: 'Tasa de exito'
      },
      section: {
        account: 'Cuenta',
        personalInfo: 'Informacion personal',
        milestones: 'Hitos',
        achievements: 'Logros recientes'
      },
      status: {
        activeProfile: 'Perfil activo'
      },
      info: {
        email: 'Email',
        phone: 'Telefono',
        location: 'Ubicacion',
        memberSince: 'Miembro desde'
      },
      form: {
        fullName: 'Nombre completo',
        email: 'Correo',
        phone: 'Telefono',
        location: 'Ubicacion',
        bio: 'Bio',
        fullNamePlaceholder: 'Tu nombre completo',
        phonePlaceholder: '+51 ...',
        locationPlaceholder: 'Ciudad, Pais',
        bioPlaceholder: 'Cuentanos sobre ti...',
        cancel: 'Cancelar',
        saveChanges: 'Guardar cambios'
      },
      emptyAchievements: 'Aun no hay logros. Sigue regando tus plantas! 🌱'
    },
    completeProfile: {
      eyebrow: 'Bienvenido a PlantCare',
      title: 'Completa tu perfil',
      subtitle: 'Cuentanos un poco mas para personalizar tu experiencia. Puedes omitirlo por ahora.',
      fullName: 'Nombre completo',
      phone: 'Telefono',
      location: 'Ubicacion',
      bio: 'Bio',
      fullNamePlaceholder: 'John Doe',
      phonePlaceholder: '+1 234 567 8900',
      locationPlaceholder: 'Ciudad, Pais',
      bioPlaceholder: 'Cuentanos sobre tu amor por las plantas...',
      save: 'Guardar perfil',
      saving: 'Guardando...',
      skip: 'Omitir por ahora',
      toast: {
        success: 'Exito',
        completed: 'Perfil completado. Redirigiendo...',
        error: 'Error',
        failed: 'No se pudo actualizar el perfil'
      }
    },
    watering: {
      urgency: {
        now: {
          message: 'Regar inmediatamente',
          action: 'Regar ahora'
        },
        soon: {
          message: 'Regar pronto',
          action: 'Regar hoy'
        },
        normal: {
          message: 'Horario regular',
          action: 'Programar'
        },
        flexible: {
          message: 'Cuando sea conveniente',
          action: 'Registrar riego'
        },
        unknown: {
          message: 'Desconocido',
          action: 'Revisar'
        }
      },
      schedule: {
        today: 'Hoy',
        inDays: 'En {days} dias',
        overdue: 'Atrasado!'
      },
      reason: {
        urgent: '🚨 URGENTE: Suelo muy seco ({value}%) - regar ahora',
        warning: '⚠️ ALERTA: Suelo seco ({value}%) - regar en 4 horas',
        dryingRate: '📊 Estimado por secado ({rate}%/dia): regar en ~{days} dias',
        history: '📅 Segun historial de riego (prom {avg} dias) - suelo actual: {value}%',
        fallback: '📌 Respaldo: {days} dias desde el ultimo riego (suelo actual: {value}%)',
        defaultNoHistory: '⏰ Default: sin historial - regar en {days} dias',
        noMetrics: 'Sin metricas - {days}d desde el ultimo riego',
        noData: 'Sin datos - intervalo default {days}d'
      },
      metrics: {
        soilMoisture: 'Humedad del suelo',
        temperature: 'Temperatura',
        lightLevel: 'Nivel de luz',
        airHumidity: 'Humedad del aire',
        battery: 'Bateria'
      },
      healthBadge: {
        healthy: 'Saludable',
        fair: 'Aceptable',
        warning: 'Atencion',
        critical: 'Critico'
      }
    }
  },
  en: {
    common: {
      menu: 'Menu',
      back: 'Back',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      update: 'Update',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      retry: 'Retry',
      close: 'Close',
      logoAlt: 'PlantCare logo'
    },
    errors: {
      notAuthenticated: 'User not authenticated.',
      notAuthenticatedLogin: 'User not authenticated. Please log in.',
      dashboardLoad: 'Failed to load dashboard data.',
      analyticsLoad: 'Failed to load analytics data.'
    },
    header: {
      greeting: 'Hello, {name}',
      subtitle: 'ready to explore the green side',
      theme: {
        dark: 'Dark',
        light: 'Light'
      }
    },
    sidebar: {
      nav: {
        dashboard: 'Dashboard',
        plants: 'Plants',
        settings: 'Settings',
        profile: 'Profile',
        analytics: 'Analytics'
      },
      status: {
        signedIn: 'Signed in',
        signedOut: 'Signed out'
      },
      logout: 'Sign out',
      guest: 'Guest'
    },
    settings: {
      title: 'Settings',
      appearance: {
        title: 'Appearance',
        description: 'Choose your preferred theme for the application.',
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      },
      language: {
        title: 'Language',
        description: 'Select your preferred language.'
      },
      notifications: {
        title: 'Notifications',
        watering: {
          title: 'Watering Reminders',
          description: "Get notified when it's time to water your plants"
        },
        humidity: {
          title: 'Low Humidity Alerts',
          description: 'Receive alerts when humidity drops below safe levels'
        },
        weekly: {
          title: 'Weekly Reports',
          description: 'Get weekly plant health summaries via email'
        },
        push: {
          title: 'Push Notifications',
          description: 'Enable browser push notifications for real-time alerts'
        }
      },
      account: {
        title: 'Account',
        email: 'Email',
        userId: 'User ID'
      },
      danger: {
        title: 'Danger Zone',
        clearTitle: 'Clear App Data',
        clearDesc: 'Remove all local preferences and cached data. Your account will not be deleted.',
        clearButton: 'Clear Data',
        signOutTitle: 'Sign Out',
        signOutDesc: 'Log out of your account on this device.',
        signOutButton: 'Sign Out',
        cancel: 'Cancel',
        confirm: 'Confirm'
      },
      toast: {
        cleared: 'Local data cleared successfully'
      }
    },
    dashboard: {
      loading: 'Syncing dashboard orbit...',
      nextPlant: 'Next Plant to Water',
      waterNow: 'Water Now',
      recentActivity: 'Recent Activity',
      viewAll: 'View All',
      stats: {
        totalPlants: 'Total plants',
        activeAlerts: 'Active Alerts',
        avgHumidity: 'Avg Humidity',
        healthScore: 'Health Score',
        excellent: 'Excellent'
      },
      activity: {
        wateredTitle: 'Watered {name}',
        description: 'Completed watering task'
      },
      due: {
        overdueHours: 'Overdue by {hours}h',
        overdueDays: 'Overdue by {days}d',
        dueHours: 'Due in {hours}h',
        dueDays: 'Due in {days}d',
        lastWateredHours: 'Last watered {hours}h ago',
        lastWateredDays: 'Last watered {days}d ago',
        needsReview: 'Needs review'
      },
      noLocation: 'No location'
    },
    analytics: {
      header: {
        eyebrow: 'Dashboard',
        title: 'Analytics & Reports',
        subtitle: 'Track your plant care performance and growth trends'
      },
      badge: {
        last30Days: 'Last 30 Days'
      },
      loading: 'Syncing sensor data...',
      error: {
        title: 'Unable to Load Analytics',
        retry: 'Retry'
      },
      empty: {
        noPlants: {
          title: 'No Plants Added Yet',
          subtitle: 'Add your first plant to start tracking its growth and health.',
          cta: 'Add My First Plant'
        },
        noData: {
          title: 'Waiting for Data...',
          subtitle: "Your plants are added, but we haven't received any sensor data yet.",
          hint: 'Analytics will appear once your sensors start transmitting.'
        },
        noHistory: {
          title: 'No Historical Data Available',
          subtitle: 'Historical analytics will appear once sensor data is collected.'
        }
      },
      stats: {
        totalPlants: 'Total Plants',
        healthyPlants: 'Healthy Plants',
        avgHumidity: 'Avg Humidity',
        avgSoilMoisture: 'Avg Soil Moisture',
        needAttention: 'Need Attention',
        trendMonth: '+2 this month',
        healthRate: '{rate}% health rate',
        ambientLevel: 'Ambient level',
        readings: '{count} readings',
        vsYesterday: '-1 vs yesterday'
      },
      section: {
        sensor: 'Sensor',
        overview: 'Overview',
        history: 'History'
      },
      charts: {
        temperatureTitle: 'Temperature Trends',
        temperatureSub: 'Average temperature across all plants',
        humidityTitle: 'Humidity Trends',
        humiditySub: 'Average humidity across all plants',
        healthTitle: 'Plant Health Distribution',
        healthSub: 'Current status of all your plants',
        soilTitle: 'Soil Moisture',
        soilSub: 'Average soil moisture level',
        soilLabel: 'Soil Moisture',
        soilReadings: '{count} total readings',
        soilOptimal: 'Optimal: 40-60%',
        lightTitle: 'Light Level',
        lightSub: 'Average light intensity',
        lightLabel: 'Light Level',
        lightAverage: 'Average intensity',
        historicalTitle: 'Historical Analytics',
        historicalSub: 'Average from last 5 sensor readings',
        refresh: 'Refresh'
      },
      legend: {
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical'
      },
      historical: {
        temperature: 'Temperature',
        humidity: 'Humidity',
        soilMoisture: 'Soil Moisture',
        lightLevel: 'Light Level',
        lastReadings: 'Last {count} readings',
        averageLevel: 'Average level',
        period: 'Period: {start} – {end}'
      },
      days: {
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wed',
        thu: 'Thu',
        fri: 'Fri',
        sat: 'Sat',
        sun: 'Sun'
      }
    },
    plants: {
      hero: {
        eyebrow: 'Plant Insights',
        title: 'Your Greenhouse',
        subtitle: 'Monitor health, track watering and keep your green space thriving.'
      },
      search: {
        placeholder: 'Search name or type...',
        aria: 'Search plants'
      },
      addPlant: 'Add Plant',
      filters: {
        aria: 'Filter by status',
        all: 'All Plants',
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical'
      },
      menu: {
        edit: 'Edit',
        delete: 'Delete'
      },
      confirm: {
        deleteMessage: 'Delete "{name}"? This cannot be undone.',
        deleteHeader: 'Confirm Deletion'
      },
      toast: {
        deleted: 'Deleted',
        plantRemoved: 'Plant removed',
        error: 'Error',
        couldNotDelete: 'Could not delete plant'
      },
      card: {
        view: 'View {name}',
        options: 'Options',
        humidity: 'Humidity',
        lastWatered: 'Last watered'
      },
      status: {
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical'
      },
      empty: {
        title: 'No plants found',
        descAll: 'Add your first plant to start monitoring.',
        descFiltered: 'No plants with "{status}" status.',
        addFirst: 'Add Your First Plant'
      }
    },
    plantDetail: {
      loading: 'Syncing sensor data...',
      back: 'Plants',
      backAria: 'Back to Plants',
      live: 'Live',
      connectedProfile: 'Connected Profile',
      section: {
        liveTelemetry: 'Live Telemetry',
        environmentSnapshot: 'Environment Snapshot'
      },
      metric: {
        temperature: 'Temperature',
        airHumidity: 'Air Humidity',
        light: 'Light',
        soilHumidity: 'Soil Humidity'
      },
      watering: {
        title: 'Watering Schedule',
        nextUp: 'Next up',
        lastWatered: 'Last Watered',
        nextWatering: 'Next Watering',
        button: 'Water Plant',
        buttonLoading: 'Watering...'
      },
      delete: 'Delete Plant',
      notFound: {
        title: 'Plant Not Found',
        desc: 'The specified ID does not correspond to any registered plant.',
        back: 'Back to Plants'
      },
      toast: {
        success: 'Success',
        waterSuccess: '💧 Plant watered successfully!',
        error: 'Error',
        waterFail: 'Failed to water the plant.',
        deleteSuccess: 'Plant deleted successfully',
        deleteFail: 'There was an error deleting the plant',
        cancelled: 'Cancelled',
        deleteCancelled: 'Deletion cancelled'
      },
      confirm: {
        deleteMessage: 'Are you sure you want to delete this plant? This action cannot be undone.',
        deleteHeader: 'Confirm Deletion'
      }
    },
    plantAnalytics: {
      title: '📊 Watering Analytics',
      stats: {
        totalWaterings: 'Total Waterings',
        daysBetween: 'Days Between',
        successRate: 'Success Rate',
        daysWithoutWater: 'Days Without Water'
      },
      logs: {
        title: '🕐 Recent Watering Logs',
        latest: 'Latest',
        empty: 'No watering records yet. Tap "Water Now" to create the first entry! 💧'
      },
      summary: {
        title: '📋 Summary',
        thisWeek: 'waterings this week',
        thisMonth: 'waterings this month'
      },
      time: {
        today: 'Today',
        yesterday: 'Yesterday',
        daysAgo: '{count} days ago',
        weeksAgo: '{count} weeks ago',
        monthsAgo: '{count} months ago'
      }
    },
    health: {
      details: {
        soilVeryDry: '🚨 Soil very dry ({value}%)',
        soilDry: '⚠️ Soil dry ({value}%)',
        soilTooWet: '⚠️ Soil too wet ({value}%)',
        tempExtreme: '🚨 Extreme temperature ({value}°C)',
        tempSuboptimal: '⚠️ Temperature suboptimal ({value}°C)',
        lowLight: '💡 Low light ({value} lux)',
        humidityExtreme: '💧 Humidity extreme ({value}%)',
        lowBattery: '🔋 Low battery ({value}%)',
        allOptimal: '✅ All conditions optimal'
      }
    },
    plantForm: {
      back: 'Back to Plants',
      eyebrow: 'Plant Profile',
      titleEdit: 'Edit Plant',
      titleAdd: 'Add a Plant',
      statusEditing: 'Editing Entry',
      statusNew: 'New Entry',
      field: {
        name: 'Name',
        type: 'Type',
        image: 'Image URL',
        location: 'Location',
        bio: 'Bio'
      },
      placeholder: {
        name: 'e.g. Monstera Deliciosa',
        type: 'e.g. Tropical, Succulent',
        image: 'https://...',
        location: 'e.g. Living Room',
        bio: 'Describe your plant...'
      },
      hint: {
        image: 'You can paste an image URL from the web.'
      },
      error: {
        nameRequired: 'Name is required',
        typeRequired: 'Type is required',
        loadFailed: 'Failed to load plant details.',
        mustSignIn: 'You must be signed in to create a plant. Redirecting...',
        noUserId: 'No userId found to associate the plant.',
        sessionExpired: 'Session expired. Please sign in again.',
        noPermission: 'You do not have permission to create plants.',
        invalidData: 'Invalid data',
        unknown: 'Unknown error',
        validation: 'Validation error: {message}',
        generic: 'Error: {message}'
      },
      action: {
        reset: 'Reset',
        update: 'Update Plant',
        save: 'Save Plant'
      }
    },
    auth: {
      form: {
        email: 'Email',
        password: 'Password',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        submit: 'Login',
        loading: 'Loading...'
      },
      login: {
        brandTitle: 'PlantCare',
        headline: 'Smart plant care, reimagined.',
        description: 'Access your dashboard with a clean, secure and futuristic experience.',
        secure: 'Secure',
        secureDesc: 'Protected sign in',
        fast: 'Fast',
        fastDesc: 'Smooth access flow',
        modern: 'Modern',
        modernDesc: 'Minimal interface',
        welcome: 'Welcome Back',
        subtitle: 'Please enter your credentials to login',
        noAccount: "Don't have an account?",
        createNow: 'Create one now'
      },
      signup: {
        eyebrow: 'PlantCare Secure Access',
        title: 'Create Account',
        subtitle: 'Join us and start your plant care journey',
        emailLabel: 'Email Address',
        passwordLabel: 'Password',
        confirmLabel: 'Confirm Password',
        emailPlaceholder: "your{'@'}email.com",
        passwordPlaceholder: 'Minimum 8 characters with uppercase, lowercase, number & symbol',
        confirmPlaceholder: 'Re-enter your password',
        emailRequired: 'Email is required.',
        emailInvalid: 'Please enter a valid email.',
        passwordRequired: 'Password is required.',
        passwordInvalid: 'Password must include: {issues}.',
        confirmRequired: 'Please confirm your password.',
        passwordMismatch: 'Passwords do not match.',
        passwordsMatch: 'Passwords match',
        strengthLabel: 'Strength',
        strengthWeak: 'Weak',
        strengthGood: 'Good',
        strengthStrong: 'Strong',
        missing: 'Missing:',
        requirementsMet: 'Password meets all security requirements',
        requirements: {
          minLength: 'At least 8 characters',
          lowercase: 'Lowercase letter',
          uppercase: 'Uppercase letter',
          number: 'Number',
          symbol: 'Special character'
        },
        register: 'Register',
        creating: 'Creating Account...',
        haveAccount: 'Already have an account?',
        signInHere: 'Sign in here',
        waitBeforeRetry: 'Please wait before trying again.',
        allFieldsRequired: 'All fields are required.',
        invalidEmail: 'Please enter a valid email address.',
        passwordMustInclude: 'Password must include: {issues}.',
        registrationFailed: 'Registration failed. Please try again.',
        emailRegistered: 'This email is already registered. Please try signing in.',
        invalidEmailFormat: 'Invalid email format.',
        toast: {
          checkInbox: 'Check your inbox',
          accountCreated: 'Account created! Please check your email and click the confirmation link before logging in.',
          success: 'Success',
          redirectSetup: 'Account created! Redirecting to setup...',
          error: 'Error'
        }
      },
      supabase: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        enter: 'Enter',
        welcome: 'Welcome, {email}',
        signOut: 'Sign Out'
      },
      authMenu: {
        welcome: 'Welcome',
        signOut: 'Sign Out',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        guest: 'Guest'
      }
    },
    profile: {
      loading: 'Loading profile...',
      error: 'Error loading profile: {error}',
      changePhoto: 'Change photo',
      eyebrow: 'Plant Keeper',
      joined: 'Joined',
      noLocation: 'No location',
      noBio: 'No bio yet.',
      editProfile: 'Edit Profile',
      stats: {
        totalPlants: 'Total plants',
        wateringSessions: 'Watering Sessions',
        memberSince: 'Member Since',
        successRate: 'Success Rate'
      },
      section: {
        account: 'Account',
        personalInfo: 'Personal Information',
        milestones: 'Milestones',
        achievements: 'Recent Achievements'
      },
      status: {
        activeProfile: 'Active Profile'
      },
      info: {
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        memberSince: 'Member Since'
      },
      form: {
        fullName: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        location: 'Location',
        bio: 'Bio',
        fullNamePlaceholder: 'Your full name',
        phonePlaceholder: '+51 ...',
        locationPlaceholder: 'City, Country',
        bioPlaceholder: 'Tell us about yourself...',
        cancel: 'Cancel',
        saveChanges: 'Save Changes'
      },
      emptyAchievements: 'No achievements yet. Keep watering your plants! 🌱'
    },
    completeProfile: {
      eyebrow: 'Welcome to PlantCare',
      title: 'Complete Your Profile',
      subtitle: 'Tell us a bit more about yourself to personalize your experience. You can also skip this for now.',
      fullName: 'Full Name',
      phone: 'Phone Number',
      location: 'Location',
      bio: 'Bio',
      fullNamePlaceholder: 'John Doe',
      phonePlaceholder: '+1 234 567 8900',
      locationPlaceholder: 'City, Country',
      bioPlaceholder: 'Tell us about your love for plants...',
      save: 'Save Profile',
      saving: 'Saving...',
      skip: 'Skip for now',
      toast: {
        success: 'Success',
        completed: 'Profile completed! Redirecting...',
        error: 'Error',
        failed: 'Failed to update profile'
      }
    },
    watering: {
      urgency: {
        now: {
          message: 'Water immediately',
          action: 'Water Now'
        },
        soon: {
          message: 'Water soon',
          action: 'Water Today'
        },
        normal: {
          message: 'Regular schedule',
          action: 'Schedule'
        },
        flexible: {
          message: 'When convenient',
          action: 'Log Watering'
        },
        unknown: {
          message: 'Unknown',
          action: 'Check'
        }
      },
      schedule: {
        today: 'Today',
        inDays: 'In {days} days',
        overdue: 'Overdue!'
      },
      reason: {
        urgent: '🚨 URGENT: Soil critically dry ({value}%) - water NOW',
        warning: '⚠️ WARNING: Soil dry ({value}%) - water within 4 hours',
        dryingRate: '📊 Estimated by drying rate ({rate}%/day): water in ~{days} days',
        history: '📅 Based on watering history (avg {avg} days) - current soil: {value}%',
        fallback: '📌 Fallback: {days} days from last watering (current soil: {value}%)',
        defaultNoHistory: '⏰ Default: no history available - water in {days} days',
        noMetrics: 'No metrics - {days}d from last watered',
        noData: 'No data available - default {days}d interval'
      },
      metrics: {
        soilMoisture: 'Soil Moisture',
        temperature: 'Temperature',
        lightLevel: 'Light Level',
        airHumidity: 'Air Humidity',
        battery: 'Battery'
      },
      healthBadge: {
        healthy: 'Healthy',
        fair: 'Fair',
        warning: 'Warning',
        critical: 'Critical'
      }
    }
  }
};

const storedLocale = localStorage.getItem('app_language');
const initialLocale = storedLocale === 'en' || storedLocale === 'es' ? storedLocale : 'es';

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages
});
