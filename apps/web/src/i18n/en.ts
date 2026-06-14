const en: Record<string, string> = {
  // App
  'app.title': 'Chaoxing Sign',

  // Sidebar
  'sidebar.normal': 'Normal Check-in',
  'sidebar.photo': 'Photo Check-in',
  'sidebar.gesture': 'Gesture Check-in',
  'sidebar.location': 'Location Check-in',
  'sidebar.qrcode': 'QR Code Check-in',
  'sidebar.qqbot': 'WeChat Bot',
  'sidebar.accounts': 'Account Management',

  // TopBar
  'topbar.language': 'Language',
  'topbar.theme': 'Theme',

  // Dashboard
  'dashboard.title': 'Data Dashboard',
  'dashboard.totalSuccess': 'Successful Sign-ins',
  'dashboard.totalFail': 'Failed Sign-ins',
  'dashboard.todayCount': "Today's Sign-ins",
  'dashboard.successRate': 'Success Rate',
  'dashboard.byType': 'Sign-ins by Type',
  'dashboard.recentRecords': 'Recent Sign-in Records',
  'dashboard.noRecords': 'No sign-in records yet',
  'dashboard.tableTime': 'Time',
  'dashboard.tableUser': 'User',
  'dashboard.tableType': 'Type',
  'dashboard.tableStatus': 'Status',
  'dashboard.tableDetail': 'Detail',

  // Sign types
  'signType.normal': 'Normal',
  'signType.photo': 'Photo',
  'signType.gesture': 'Gesture',
  'signType.location': 'Location',
  'signType.qrcode': 'QR Code',

  // Sign common
  'sign.success': 'Sign-in Successful',
  'sign.failed': 'Sign-in Failed',
  'sign.signIn': 'Sign In',
  'sign.detectActivity': 'Detect Activity',
  'sign.detecting': 'Detecting...',
  'sign.signing': 'Signing in...',
  'sign.noActivity': 'No sign-in activity found',
  'sign.authRequired': 'Authentication required. Please re-login.',
  'sign.noCourse': 'No courses available',
  'sign.selectUser': 'Select User',
  'sign.noUser': 'No users available. Add an account first.',
  'sign.uploadPhoto': 'Select Photo',
  'sign.photoHint': 'Upload photo for check-in',
  'sign.photoSelected': 'Photo selected',
  'sign.longitude': 'Longitude',
  'sign.latitude': 'Latitude',
  'sign.address': 'Address',
  'sign.scanning': 'Scanning...',
  'sign.startCamera': 'Start Camera',
  'sign.stopCamera': 'Stop Camera',
  'sign.autoLoop': 'Auto-retry on fail',
  'sign.scanQrCode': 'Scan QR Code',
  'sign.cameraDenied': 'Camera access denied. Use file upload instead.',
  'sign.qrScanned': 'QR code scanned',
  'sign.qrScanFailed': 'QR scan failed, retrying...',
  'sign.typeMismatch': 'Activity type does not match this page',
  'sign.manualEnc': 'Manual ENC Input',
  'sign.encPlaceholder': 'Enter ENC code',

  // WeChat Work Bot
  'qqbot.title': 'WeChat Work Bot',
  'qqbot.enable': 'Enable Bot Notification',
  'qqbot.webhookUrl': 'Webhook URL',
  'qqbot.webhookHint': 'Get the webhook URL from your WeChat Work group bot settings',
  'qqbot.saveConfig': 'Save Configuration',
  'qqbot.configSaved': 'Configuration saved',

  // Account Management
  'account.title': 'Account Management',
  'account.addAccount': 'Add Account',
  'account.maxReached': 'Maximum 10 accounts reached',
  'account.batchSign': 'Batch Sign-in',
  'account.editConfig': 'Edit Config',
  'account.deleteUser': 'Delete User',
  'account.confirmDelete': 'Are you sure you want to delete this user?',
  'account.batchSummary': '{{ready}} users ready, {{skipped}} skipped',
  'account.batchSkipNoActivity': 'No activity',
  'account.batchSkipAuth': 'Auth expired',
  'account.batchSkipType': 'Type mismatch',
  'account.batchProgress': 'Signing in {{name}}...',
  'account.batchComplete': 'Batch complete: {{success}} succeeded, {{fail}} failed',
  'account.loginFailed': 'Login failed',
  'account.userAdded': 'User added successfully',

  // Config dialog
  'config.title': 'Configuration',
  'config.description': 'Configure monitoring sign-in info, email, and QQ bot settings.',
  'config.signInfo': 'Sign-in Info',
  'config.delay': 'Sign-in Delay (seconds)',
  'config.email': 'Email',
  'config.emailEnable': 'Enable Email',
  'config.emailSsl': 'Enable SSL',
  'config.emailHost': 'SMTP Host',
  'config.emailPort': 'Port',
  'config.emailSender': 'Sender',
  'config.emailPass': 'Password',
  'config.emailReceiver': 'Receiver',

  // Login dialog
  'login.title': 'Add User',
  'login.description': 'Add your Chaoxing account to sign in.',
  'login.phone': 'Phone Number',
  'login.password': 'Password',

  // Common
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.noData': 'No data',
  'common.back': 'Back',
};

export default en;
