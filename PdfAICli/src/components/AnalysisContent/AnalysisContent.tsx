/**
 * Analiz metnini markdown-benzeri biçimde (### başlıklar, **kalın**, - madde) gösterir.
 * ```markdown / ``` satırları gizlenir.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import T from '../Text/T';
import { fontSize } from '../../constants/typography';
import colors from '../../theme/colors';
import { useResponsive } from '../../utils/deviceStore/device';

const SECTION_HEADER_COLOR = colors.backgroundPurpleDark;
const BULLET_COLOR = colors.textGraySoft;
const HIGHLIGHT_BG = colors.backgroundPinkSoft; // referans dışı vurgusu
const SECTION_BG = colors.backgroundPurpleSoft;

/** Metni **kalın** parçalara böler; segments: [{ text, bold }] */
function parseBold(text: string): { text: string; bold: boolean }[] {
    const segments: { text: string; bold: boolean }[] = [];
    let rest = text;
    while (rest.length > 0) {
        const open = rest.indexOf('**');
        if (open === -1) {
            if (rest) segments.push({ text: rest, bold: false });
            break;
        }
        if (open > 0) segments.push({ text: rest.slice(0, open), bold: false });
        const close = rest.indexOf('**', open + 2);
        if (close === -1) {
            segments.push({ text: rest.slice(open), bold: false });
            break;
        }
        segments.push({ text: rest.slice(open + 2, close), bold: true });
        rest = rest.slice(close + 2);
    }
    return segments;
}

/** ```markdown ve ``` satırlarını atlayacak şekilde satır listesi */
function normalizeLines(raw: string): string[] {
    const trimmed = raw.trim();
    const lines = trimmed.split(/\n+/).map((l) => l.trim());
    return lines.filter((line) => {
        if (!line) return false;
        if (/^```\s*$/.test(line) || /^```\s*markdown\s*$/i.test(line)) return false;
        return true;
    });
}

type AnalysisContentProps = {
    content: string;
    style?: ViewStyle;
};

const AnalysisContent: React.FC<AnalysisContentProps> = ({ content, style }) => {
    const { h1px, w1px } = useResponsive();

    const blocks = useMemo(() => {
        const lines = normalizeLines(content);
        const result: { type: 'section'; text: string } | { type: 'bullet'; text: string } | { type: 'paragraph'; text: string }[] = [];
        for (const line of lines) {
            const sectionMatch = line.match(/^#{2,3}\s+(.+)$/);
            if (sectionMatch) {
                result.push({ type: 'section', text: sectionMatch[1].trim() });
                continue;
            }
            const bulletMatch = line.match(/^[-*]\s+(.+)$/);
            if (bulletMatch) {
                result.push({ type: 'bullet', text: bulletMatch[1].trim() });
                continue;
            }
            result.push({ type: 'paragraph', text: line });
        }
        return result;
    }, [content]);

    const s = useMemo(
        () =>
            StyleSheet.create({
                section: {
                    marginTop: 18 * h1px,
                    marginBottom: 8 * h1px,
                    paddingBottom: 10 * h1px,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.backgroundPurpleSoft,
                },
                sectionFirst: { marginTop: 0 },
                sectionTitle: {
                    marginBottom: 0,
                    letterSpacing: 0.3,
                },
                bulletRow: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 6 * h1px,
                    paddingLeft: 2 * w1px,
                },
                bulletDot: {
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.backgroundPurple,
                    marginTop: 6 * h1px,
                    marginRight: 8 * w1px,
                },
                bulletText: { flex: 1 },
                paragraph: {
                    marginBottom: 8 * h1px,
                    lineHeight: 22,
                },
                inlineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
                highlightWrap: {
                    backgroundColor: HIGHLIGHT_BG,
                    paddingVertical: 6 * h1px,
                    paddingHorizontal: 10 * w1px,
                    borderRadius: 10 * w1px,
                    marginBottom: 6 * h1px,
                    borderLeftWidth: 3,
                    borderLeftColor: '#E11D48',
                },
            }),
        [h1px, w1px],
    );

    const isReferansDisi = (text: string) =>
        /referans\s*[:\s]?\s*\d+\s*[-–]\s*\d+/i.test(text) && /\d+\s*\(referans/i.test(text);

    return (
        <View style={[style]}>
            {blocks.map((block, idx) => {
                if (block.type === 'section') {
                    return (
                        <View
                            key={`s-${idx}`}
                            style={[s.section, idx === 0 && s.sectionFirst]}>
                            <T
                                size={fontSize.title}
                                weight="700"
                                color={colors.textDark}
                                style={s.sectionTitle}>
                                {block.text}
                            </T>
                        </View>
                    );
                }
                if (block.type === 'bullet') {
                    const segments = parseBold(block.text);
                    const wrapHighlight = isReferansDisi(block.text);
                    const row = (
                        <View key={`b-${idx}`} style={s.bulletRow}>
                            <View style={s.bulletDot} />
                            <View style={s.bulletText}>
                                <View style={s.inlineRow}>
                                    {segments.map((seg, i) => (
                                        <T
                                            key={i}
                                            size={fontSize.body}
                                            weight={seg.bold ? '700' : '400'}
                                            color={seg.bold ? colors.textDark : BULLET_COLOR}>
                                            {seg.text}
                                        </T>
                                    ))}
                                </View>
                            </View>
                        </View>
                    );
                    return wrapHighlight ? (
                        <View key={`b-${idx}`} style={s.highlightWrap}>
                            {row}
                        </View>
                    ) : (
                        row
                    );
                }
                const segments = parseBold(block.text);
                return (
                    <View key={`p-${idx}`} style={s.paragraph}>
                        <View style={s.inlineRow}>
                            {segments.map((seg, i) => (
                                <T
                                    key={i}
                                    size={fontSize.body}
                                    weight={seg.bold ? '700' : '400'}
                                    color={seg.bold ? '#111827' : BULLET_COLOR}>
                                    {seg.text}
                                </T>
                            ))}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

export default AnalysisContent;
