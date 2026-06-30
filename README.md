### 新建安装任务

呆呆面板 → 定时任务 → 新建任务

任务名：

安装wxread

命令：

`node install_wxread.js`

定时规则随便填一个：

0 0 1 1 *

保存后，手动点 运行。

运行成功后应该看到：

`安装完成！
已生成启动器: /app/Dumb-Panel/scripts/wxread_run.js
运行命令：node wxread_run.js`

安装任务只需要跑一次。成功后可以禁用。

### **运行微信读书任务**

新建定时任务：

任务名：

微信读书刷时长

命令：

`node wxread_run.js`

定时建议：

10 1 * * *

也就是每天凌晨 1:10 跑。
### 环境变量

必须：

`WXREAD_CURL_BASH=你复制的完整curl bash`

`READ_NUM=40`

可选：

PUSH_METHOD=wxpusher

WXPUSHER_SPT=你的WxPusher token

PUSH_METHOD=pushplus

PUSHPLUS_TOKEN=你的pushplus token
