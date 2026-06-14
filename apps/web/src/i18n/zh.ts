const zh: Record<string, string> = {
  // App
  'app.title': '超星签到',

  // Sidebar
  'sidebar.normal': '普通签到',
  'sidebar.photo': '拍照签到',
  'sidebar.gesture': '手势签到',
  'sidebar.location': '位置签到',
  'sidebar.qrcode': '二维码签到',
  'sidebar.qqbot': '企业微信通知',
  'sidebar.accounts': '账户管理',

  // TopBar
  'topbar.language': '语言',
  'topbar.theme': '主题',

  // Dashboard
  'dashboard.title': '数据面板',
  'dashboard.totalSuccess': '签到成功次数',
  'dashboard.totalFail': '签到失败次数',
  'dashboard.todayCount': '今日签到次数',
  'dashboard.successRate': '成功率',
  'dashboard.byType': '各类型签到统计',
  'dashboard.recentRecords': '最近签到记录',
  'dashboard.noRecords': '暂无签到记录',
  'dashboard.tableTime': '时间',
  'dashboard.tableUser': '用户',
  'dashboard.tableType': '类型',
  'dashboard.tableStatus': '状态',
  'dashboard.tableDetail': '详情',

  // Sign types
  'signType.normal': '普通',
  'signType.photo': '拍照',
  'signType.gesture': '手势',
  'signType.location': '位置',
  'signType.qrcode': '二维码',

  // Sign common
  'sign.success': '签到成功',
  'sign.failed': '签到失败',
  'sign.signIn': '签到',
  'sign.detectActivity': '检测活动',
  'sign.detecting': '检测中...',
  'sign.signing': '签到中...',
  'sign.noActivity': '无签到活动',
  'sign.authRequired': '需要重新登录',
  'sign.noCourse': '无课程',
  'sign.selectUser': '选择用户',
  'sign.noUser': '没有可用用户，请先添加账户',
  'sign.uploadPhoto': '选择图片',
  'sign.photoHint': '上传签到照片',
  'sign.photoSelected': '已选择图片',
  'sign.longitude': '经度',
  'sign.latitude': '纬度',
  'sign.address': '地址',
  'sign.scanning': '扫描中...',
  'sign.startCamera': '打开摄像头',
  'sign.stopCamera': '关闭摄像头',
  'sign.autoLoop': '失败自动重试',
  'sign.scanQrCode': '扫描二维码',
  'sign.cameraDenied': '摄像头权限被拒绝，请使用文件上传',
  'sign.qrScanned': '二维码识别成功',
  'sign.qrScanFailed': '二维码识别失败，重试中...',
  'sign.typeMismatch': '活动类型与此页面不匹配',
  'sign.manualEnc': '手动输入ENC',
  'sign.encPlaceholder': '输入ENC编码',

  // WeChat Work Bot
  'qqbot.title': '企业微信机器人',
  'qqbot.enable': '启用机器人通知',
  'qqbot.webhookUrl': 'Webhook 地址',
  'qqbot.webhookHint': '在企业微信群聊中添加机器人，复制 Webhook 地址粘贴到此处',
  'qqbot.saveConfig': '保存配置',
  'qqbot.configSaved': '配置已保存',

  // Account Management
  'account.title': '账户管理',
  'account.addAccount': '添加账户',
  'account.maxReached': '已达到10个账户上限',
  'account.batchSign': '批量签到',
  'account.editConfig': '编辑配置',
  'account.deleteUser': '删除用户',
  'account.confirmDelete': '确定要删除此用户吗？',
  'account.batchSummary': '{{ready}} 个用户就绪，{{skipped}} 个已跳过',
  'account.batchSkipNoActivity': '无活动',
  'account.batchSkipAuth': '登录过期',
  'account.batchSkipType': '类型不匹配',
  'account.batchProgress': '正在为 {{name}} 签到...',
  'account.batchComplete': '批量签到完成: {{success}} 成功, {{fail}} 失败',
  'account.loginFailed': '登录失败',
  'account.userAdded': '用户添加成功',

  // Config dialog
  'config.title': '配置',
  'config.description': '配置监听模式下的签到信息、邮箱和QQ机器人信息。',
  'config.signInfo': '签到信息',
  'config.delay': '签到延时 (秒)',
  'config.email': '邮件',
  'config.emailEnable': '启用邮件功能',
  'config.emailSsl': '启用 SSL 协议',
  'config.emailHost': 'SMTP 主机',
  'config.emailPort': '端口',
  'config.emailSender': '发送者',
  'config.emailPass': '密钥',
  'config.emailReceiver': '接收者',

  // Login dialog
  'login.title': '添加用户',
  'login.description': '添加你的学习通账号，完成后可选择账号进行签到。',
  'login.phone': '手机号码',
  'login.password': '密码',

  // Common
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.delete': '删除',
  'common.loading': '加载中...',
  'common.error': '错误',
  'common.success': '成功',
  'common.noData': '暂无数据',
  'common.back': '返回',
  'common.ready': '就绪',
};

export default zh;
