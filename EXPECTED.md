# 検証用OKFバンドル 期待状態表（2026-11-24）

- 対象バンドル：`~/workspace/law-coverage/bundle/`（law 50件、rule 20件、procedure 4件、manual 1件、setting 2件、evidence 3件、decision 1件、計81ファイル）
- 判定基準：仕様書（2026-11-24-coverage-system-spec.md）4. の判定ロジックと優先順位（適用外 → 未対応 → 鮮度切れ → 手順なし → 根拠なし → 証跡なし → 対応済み）
- 判定日：2026-11-24（すべての文書の verified は 2026-11-24。例外は意図的な異常系のみ）
- 導出方法：バンドルの frontmatter を機械的に集計して導出し、手作業の導出と突き合わせて一致を確認した。

## 期待状態の内訳

| 状態 | 件数 | 該当ID |
|---|---|---|
| 対応済み | 1 | law-lsa-007（※要確認。下記注記参照） |
| 鮮度切れ | 1 | law-lsa-006 |
| 手順なし | 15 | law-lsa-003, 004, 025, 026, 033, 034, 035, 041, 043, 044, 045, 046, 047, 048, 050 |
| 証跡なし | 15 | law-lsa-001, 002, 005, 016, 017, 018, 019, 020, 021, 022, 023, 024, 029, 030, 032 |
| 根拠なし | 6 | law-lsa-009, 010, 011, 012, 013, 014 |
| 未対応 | 11 | law-lsa-008, 027, 028, 031, 036, 037, 038, 039, 040, 042, 049 |
| 適用外 | 1 | law-lsa-015 |
| 合計 | 50 | |

## 要件ごとの期待状態と根拠

| ID | 要件名 | 期待状態 | 根拠（紐づく文書） |
|---|---|---|---|
| law-lsa-001 | 法定労働時間（週） | 証跡なし | rule-model-019 と man-001 が covers。evidence なし |
| law-lsa-002 | 法定労働時間（日） | 証跡なし | rule-model-019 と man-001 が covers。evidence なし |
| law-lsa-003 | 変形労働時間制の手続 | 手順なし | rule-model-019 のみ。procedure／manual なし |
| law-lsa-004 | 労働時間の把握 | 手順なし | rule-model-017 のみ。procedure／manual なし |
| law-lsa-005 | 休憩時間の付与 | 証跡なし | rule-model-019 と man-001 が covers。evidence なし |
| law-lsa-006 | 法定休日の付与 | 鮮度切れ | rule-model-020（stale_after: 2026-10-01、判定日より過去）と man-001 が covers。優先順位3により鮮度切れ |
| law-lsa-007 | 36協定の締結と届出 | 対応済み ※要確認 | rule-model-021 と proc-001 が covers、ev-001（expires: 2027-03-31、有効）が supports。ただし ev-003（expires: 2026-03-31、期限切れ）も supports しており、解釈によっては鮮度切れになりうる（下記注記） |
| law-lsa-008 | 36協定の記載事項 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-009 | 時間外労働の上限（原則） | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-010 | 時間外労働の上限（1年単位変形の特例値） | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-011 | 特別条項の年上限 | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-012 | 特別条項の月合計上限 | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-013 | 複数月平均の上限 | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-014 | 月45時間超の回数制限 | 根拠なし | proc-001 のみが covers。rule なし |
| law-lsa-015 | 上限規制の特例業種 | 適用外 | dec-001（status: accepted）が applies_to に含み、本文に適用除外の理由（自動車運転業務の対象者がいない）を記載。優先順位1 |
| law-lsa-016 | 時間外労働の割増率 | 証跡なし | rule-model-040 と proc-002、set-001（設定）が covers。evidence なし。設定でカバー（viaSetting: true） |
| law-lsa-017 | 月60時間超の割増率 | 証跡なし | rule-model-040 と proc-002、set-001（設定）が covers。evidence なし。設定でカバー（viaSetting: true） |
| law-lsa-018 | 法定休日労働の割増率 | 証跡なし | rule-model-040 と proc-002、set-001（設定）が covers。evidence なし。設定でカバー（viaSetting: true） |
| law-lsa-019 | 深夜労働の割増率 | 証跡なし | rule-model-040 と proc-002、set-001（設定）が covers。evidence なし。設定でカバー（viaSetting: true） |
| law-lsa-020 | 代替休暇の労使協定 | 証跡なし | rule-model-042 と proc-002 が covers。evidence なし |
| law-lsa-021 | 割増賃金の算定基礎 | 証跡なし | rule-model-040 と proc-002 が covers。evidence なし |
| law-lsa-022 | 賃金支払の原則（通貨・直接・全額） | 証跡なし | rule-model-047 と proc-002 が covers。evidence なし |
| law-lsa-023 | 賃金の定期払い | 証跡なし | rule-model-046 と proc-002 が covers。evidence なし |
| law-lsa-024 | 賃金控除の要件 | 証跡なし | rule-model-047 と proc-002 が covers。evidence なし |
| law-lsa-025 | 非常時払い | 手順なし | rule-model-048 のみ。procedure／manual なし |
| law-lsa-026 | 休業手当 | 手順なし | rule-model-044 のみ。procedure／manual なし |
| law-lsa-027 | 最低賃金 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-028 | 死亡・退職時の賃金支払 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-029 | 有給休暇の付与要件と初回日数 | 証跡なし | rule-model-023 と set-002（設定）が covers。procedure／manual はないが設定が実施手段として数えられ、evidence なしのため証跡なし。設定でカバー（viaSetting: true） |
| law-lsa-030 | 有給休暇の加算日数 | 証跡なし | rule-model-023 と set-002（設定）が covers。procedure／manual はないが設定が実施手段として数えられ、evidence なしのため証跡なし。設定でカバー（viaSetting: true） |
| law-lsa-031 | 短時間労働者への比例付与 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-032 | 年5日取得義務 | 証跡なし | rule-model-023 と proc-003 が covers。evidence なし |
| law-lsa-033 | 時季変更権の範囲 | 手順なし | rule-model-023 のみ。procedure／manual なし |
| law-lsa-034 | 時間単位年休の要件 | 手順なし | rule-model-024 のみ。procedure／manual なし |
| law-lsa-035 | 有給休暇期間の賃金 | 手順なし | rule-model-043 のみ。procedure／manual なし |
| law-lsa-036 | 年次有給休暇管理簿 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-037 | 労働者名簿の調製 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-038 | 賃金台帳の調製 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-039 | 記録の保存期間 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-040 | 法令・就業規則・協定の周知 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-041 | 就業規則の作成・届出 | 手順なし | rule-model-001 が covers、ev-002 が supports。ただし procedure／manual がないため、優先順位4（手順なし）が優先順位6（証跡なし）より先に適用される |
| law-lsa-042 | 就業規則の意見聴取 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」。ev-002 の本文は意見書の添付に触れるが、supports は law-lsa-041 のみ） |
| law-lsa-043 | 労働条件の明示 | 手順なし | rule-model-007 のみ。procedure／manual なし |
| law-lsa-044 | 明示事項：就業場所・業務の変更の範囲（2024年4月追加） | 手順なし | rule-model-007 のみ。procedure／manual なし |
| law-lsa-045 | 明示事項：有期契約の更新基準・上限（2024年4月追加） | 手順なし | rule-model-007 のみ。procedure／manual なし |
| law-lsa-046 | 明示事項：無期転換申込機会（2024年4月追加） | 手順なし | rule-model-007 と rule-model-057 が covers。procedure／manual なし |
| law-lsa-047 | 解雇予告 | 手順なし | rule-model-053 のみ。procedure／manual なし |
| law-lsa-048 | 解雇予告の適用除外と経過 | 手順なし | rule-model-006 のみ。procedure／manual なし |
| law-lsa-049 | 解雇制限期間 | 未対応 | covers／supports する文書なし（対応表でも「モデル就業規則に条項なし」） |
| law-lsa-050 | 減給制裁の制限 | 手順なし | rule-model-067 と rule-model-068 が covers。procedure／manual なし |

## 注記（要確認・設計上の論点）

1. **law-lsa-007 の鮮度判定（要確認）**：ev-003（前年度の36協定届出、expires: 2026-03-31）が期限切れのまま supports に残っている。仕様4. の鮮度切れ条件「evidence が expires 超過」を「紐づく evidence のいずれか1件でも期限切れなら鮮度切れ」と字面どおりに読むと、本件は鮮度切れになる。一方、ev-001（当期分、expires: 2027-03-31）という有効な証跡が存在する以上、「有効な証跡があるかどうか」で判定する解釈では対応済みになる。本表では後者（対応済み）を期待状態とし、前者の解釈を採る実装では鮮度切れと表示されうる点を要確認とした。期限切れ証跡そのものの検出は、ev-003 単体の表示（証跡一覧・文書詳細での期限切れ表示）で確認する想定。
2. **proc-999（孤立文書）**：covers が空の procedure。どの law の状態にも影響しない。診断レポート側の「過剰・棚卸し対象」として検出されることを期待する（仕様4-2.）。
3. **law-lsa-041 の優先順位**：evidence（ev-002）はあるが procedure／manual がないため、証跡なしではなく手順なしになる。優先順位の適用例として意図した配置。
4. **カバー率の参考値**：対応済み率は 1 ÷（50 − 適用外1）＝ 約2.0%。モデル就業規則は「規則」層の雛形であり、手順・証跡は実務側で用意するものなので、検証用バンドルとしてはこの低さが仕様どおりの結果である（ダッシュボードの表示確認用）。
5. **設定文書（set-001 / set-002）**：設定は procedure / manual と同格の実施手段として扱う。DBの生値の機械照合はせず、設定場所と内容が本文に書かれていることをもってカバーとする。law-lsa-016〜019 は set-001、law-lsa-029/030 は set-002 により「設定でカバー」となり、029/030 は手順なしから証跡なしに変わる。それ以外の要件の状態は変わらない。
