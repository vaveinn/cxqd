/**
 * 企业微信机器人 — 通过 Webhook 发送消息
 * 只需一个 Webhook URL，无需 WebSocket 长连接
 *
 * 使用方式:
 *   const bot = new WeworkBot('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx', 'http://192.168.1.100:3000');
 *   bot.send('签到成功 - 张三');
 *   bot.sendTemplateCard({ user, type, time, status, ... });
 */

interface CardButton {
  text: string;
  style?: 1 | 2 | 3 | 4; // 1=蓝 2=绿 3=红 4=灰
  url: string;
}

interface CardField {
  keyname: string;
  value: string;
}

interface TemplateCardParams {
  title: string;
  user: string;
  signType: string;
  time: string;
  status?: string;       // 可选，结果通知时使用
  statusOk?: boolean;    // 成功/失败
  delay?: number;        // 检测通知时使用
  signUrl?: string;      // 点击卡片跳转的签到页面
}

export default class WeworkBot {
  #webhook_url: string;
  #base_url: string;

  constructor(webhook_url: string, base_url?: string) {
    this.#webhook_url = webhook_url;
    this.#base_url = base_url || 'http://localhost:3000';
  }

  /** 设置 Web 面板地址 */
  setBaseUrl(url: string) {
    this.#base_url = url;
  }

  /** 发送文本消息 */
  async send(text: string): Promise<boolean> {
    return this.#post({
      msgtype: 'text',
      text: { content: text },
    });
  }

  /** 发送 Markdown 消息 */
  async sendMarkdown(content: string): Promise<boolean> {
    return this.#post({
      msgtype: 'markdown',
      markdown: { content },
    });
  }

  /**
   * 发送模板卡片 — 带按钮的交互式通知
   * 检测到签到 → 卡片上可直接点击跳转签到页面
   */
  async sendTemplateCard(params: TemplateCardParams): Promise<boolean> {
    const { title, user, signType, time, status, statusOk, delay, signUrl } = params;

    const isDetect = status === undefined; // true = 检测通知, false = 结果通知

    const horizontal_content_list: CardField[] = [
      { keyname: '用户', value: user },
      { keyname: '类型', value: signType },
      { keyname: '时间', value: time },
    ];

    if (!isDetect) {
      horizontal_content_list.push({
        keyname: '结果',
        value: statusOk ? '✅ 签到成功' : `❌ ${status}`,
      });
    } else if (delay !== undefined && delay > 0) {
      horizontal_content_list.push({
        keyname: '延时',
        value: `${delay} 秒后自动处理`,
      });
    }

    // 点击卡片整体跳转
    const card_action_url = signUrl || `${this.#base_url}/dashboard`;

    // 操作按钮列表
    const button_list: CardButton[] = [
      { text: '📋 普通签到', style: 1, url: `${this.#base_url}/normal` },
      { text: '📸 拍照签到', style: 1, url: `${this.#base_url}/photo` },
      { text: '📍 位置签到', style: 1, url: `${this.#base_url}/location` },
      { text: '📱 扫码签到', style: 2, url: `${this.#base_url}/qrcode` },
    ];

    // 如果是检测通知，多加一个强调提示
    const emphasis_title = isDetect
      ? `检测到${signType}`
      : (statusOk ? '签到成功' : '签到失败');

    const emphasis_desc = isDetect
      ? (delay && delay > 0 ? `将在 ${delay} 秒后自动处理` : '正在自动处理...')
      : (statusOk ? user : `${user}: ${status || '失败'}`);

    const main_title_desc = isDetect
      ? '点击下方按钮可手动进入签到页面'
      : '详情如下';

    return this.#post({
      msgtype: 'template_card',
      template_card: {
        card_type: 'text_notice',
        source: {
          icon_url: 'https://wework.qpic.cn/wwpic/252813_jOfDHtcISzuodLa_1629280209/0',
          desc: '超星签到系统',
          desc_color: 0,
        },
        main_title: {
          title: title,
          desc: main_title_desc,
        },
        emphasis_content: {
          title: emphasis_title,
          desc: emphasis_desc,
        },
        horizontal_content_list,
        card_action: {
          type: 1, // 1=跳转URL
          url: card_action_url,
        },
        button_list,
      },
    });
  }

  /** 底层 POST 请求 */
  async #post(body: any): Promise<boolean> {
    try {
      const resp = await fetch(this.#webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result: any = await resp.json();
      if (result.errcode === 0) {
        console.log('[企业微信] 消息已发送');
        return true;
      } else {
        console.log(`[企业微信] 发送失败: ${result.errmsg} (${result.errcode})`);
        return false;
      }
    } catch (e) {
      console.log('[企业微信] 发送异常:', e);
      return false;
    }
  }
}
