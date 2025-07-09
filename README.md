# Date MCP Server

現在時刻を提供するMCP (Model Context Protocol) サーバーです。AIエージェントが「最近の」「今の」などの時制を正しく理解できるよう、詳細な時刻情報を提供します。

## 機能

- 現在の日時を複数のフォーマットで提供
- タイムゾーンの変換をサポート
- 指定された日時と現在時刻の差を計算
- 詳細な時刻コンポーネント（年、月、日、時、分、秒など）を提供

## インストール

```bash
npm install
npm run build
```

## 使用方法

### 開発モード
```bash
npm run dev
```

### ビルド済みバージョンの実行
```bash
npm start
```

## 利用可能なツール

### get_current_time
現在の日時を取得します。

パラメータ:
- `timezone` (オプション): タイムゾーン（例: "Asia/Tokyo", "America/New_York"）
- `locale` (オプション): ロケール（例: "ja-JP", "en-US"、デフォルト: "ja-JP"）

戻り値の例:
```json
{
  "current": {
    "iso": "2025-07-09T10:30:00.000Z",
    "unix": 1741685400,
    "human": "2025年7月9日水曜日 19:30:00 日本標準時",
    "milliseconds": 1741685400000
  },
  "timezone": {
    "system": "Asia/Tokyo",
    "requested": "Asia/Tokyo",
    "offset": -540
  },
  "components": {
    "year": 2025,
    "month": 7,
    "day": 9,
    "hour": 19,
    "minute": 30,
    "second": 0,
    "dayOfWeek": 3,
    "weekOfYear": 28
  },
  "context": {
    "isWeekend": false,
    "quarter": 3,
    "dayOfYear": 190,
    "daysInMonth": 31
  }
}
```

### get_time_difference
指定された日時と現在時刻の差を計算します。

パラメータ:
- `target_date` (必須): 比較対象の日時（ISO 8601形式）
- `unit` (オプション): 表示する単位（"seconds", "minutes", "hours", "days", "all"、デフォルト: "all"）

## Claude Codeでの設定

Claude Codeの設定ファイルに以下を追加します:

```json
{
  "mcpServers": {
    "date-mcp": {
      "command": "node",
      "args": ["/path/to/date-mcp/dist/index.js"]
    }
  }
}
```

## ライセンス

MIT