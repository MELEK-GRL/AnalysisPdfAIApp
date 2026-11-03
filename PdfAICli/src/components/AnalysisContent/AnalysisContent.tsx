/**
 * Analiz metnini kartlı, ikonlu bölümler olarak gösterir.
 * ### başlıklar, 1) Başlık, **kalın**, - madde desteklenir.
 */
import React, {useMemo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../Text/T';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import colors from '../../theme/colors';
import {useResponsive} from '../../utils/deviceStore/device';

const BODY = colors.textGraySoft;
const ALERT = '#B45309';
const ALERT_BG = '#FFFBEB';
const ALERT_BORDER = '#FDE68A';
const WARN = '#B91C1C';
const WARN_BG = colors.backgroundPinkSoft;
const WARN_BORDER = '#FECACA';
const OK = '#15803D';
const OK_BG = '#F0FDF4';
const OK_BORDER = '#BBF7D0';

type Block =
  | {type: 'section'; text: string}
  | {type: 'bullet'; text: string}
  | {type: 'paragraph'; text: string};

type SectionTone = 'default' | 'ok' | 'alert' | 'warn';

type SectionCard = {
  title: string;
  tone: SectionTone;
  icon: string;
  body: Block[];
};

function parseBold(text: string): {text: string; bold: boolean}[] {
  const segments: {text: string; bold: boolean}[] = [];
  let rest = text;
  while (rest.length > 0) {
    const open = rest.indexOf('**');
    if (open === -1) {
      if (rest) {
        segments.push({text: rest, bold: false});
      }
      break;
    }
    if (open > 0) {
      segments.push({text: rest.slice(0, open), bold: false});
    }
    const close = rest.indexOf('**', open + 2);
    if (close === -1) {
      segments.push({text: rest.slice(open), bold: false});
      break;
    }
    segments.push({text: rest.slice(open + 2, close), bold: true});
    rest = rest.slice(close + 2);
  }
  return segments;
}

function normalizeLines(raw: string): string[] {
  return raw
    .trim()
    .split(/\n+/)
    .map(l => l.trim())
    .filter(line => {
      if (!line) {
        return false;
      }
      if (/^```\s*$/.test(line) || /^```\s*markdown\s*$/i.test(line)) {
        return false;
      }
      return true;
    });
}

function cleanSectionTitle(raw: string): string {
  return raw
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\d+[\)\.\-–:]\s*/, '')
    .trim();
}

function sectionMeta(title: string): {tone: SectionTone; icon: string} {
  const t = title.toLocaleLowerCase('tr-TR');
  if (/uyarı|disclaimer|warning|önemli/.test(t)) {
    return {tone: 'warn', icon: 'shield-checkmark-outline'};
  }
  if (/tavsiye|öneri|advice|recommend/.test(t)) {
    return {tone: 'default', icon: 'leaf-outline'};
  }
  if (
    /öne\s*çıkan|dikkat|bulgu|finding|referans\s*dışı|alert|notable/.test(t)
  ) {
    return {tone: 'alert', icon: 'alert-circle-outline'};
  }
  if (/özet|summary|genel/.test(t)) {
    return {tone: 'default', icon: 'document-text-outline'};
  }
  return {tone: 'default', icon: 'ellipse-outline'};
}

/** Metin “sorun yok” mu — bulgular kartını yeşile çeker */
function bodyLooksClear(blocks: Block[]): boolean {
  const text = blocks
    .map(b => b.text)
    .join(' ')
    .toLocaleLowerCase('tr-TR');
  if (!text.trim()) {
    return true;
  }
  if (
    /bulunmadı|yoktur|yok\.|içindedir|normal|sorun\s*yok|no\s*(out-of-range|findings)/i.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /referans\s*dışı|yüksek|düşük|pozitif|reaktif|dikkat\s*edil|out\s*of\s*range/i.test(
      text,
    )
  ) {
    return false;
  }
  return false;
}

function parseBlocks(content: string): Block[] {
  const lines = normalizeLines(content);
  const result: Block[] = [];
  for (const line of lines) {
    const mdSection = line.match(/^#{1,3}\s+(.+)$/);
    if (mdSection) {
      result.push({type: 'section', text: cleanSectionTitle(mdSection[1])});
      continue;
    }
    const numbered = line.match(/^\d+[\)\.\-–:]\s+(.+)$/);
    if (numbered && numbered[1].length < 80 && !/[.!?]$/.test(numbered[1])) {
      result.push({type: 'section', text: cleanSectionTitle(numbered[1])});
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      result.push({type: 'bullet', text: bullet[1].trim()});
      continue;
    }
    result.push({type: 'paragraph', text: line});
  }
  return result;
}

function groupSections(blocks: Block[]): SectionCard[] {
  const cards: SectionCard[] = [];
  let current: SectionCard | null = null;

  const pushLoose = (block: Block) => {
    if (!current) {
      const meta = sectionMeta('Özet');
      current = {
        title: 'Özet',
        tone: meta.tone,
        icon: 'document-text-outline',
        body: [],
      };
      cards.push(current);
    }
    current.body.push(block);
  };

  for (const block of blocks) {
    if (block.type === 'section') {
      const meta = sectionMeta(block.text);
      current = {
        title: block.text,
        tone: meta.tone,
        icon: meta.icon,
        body: [],
      };
      cards.push(current);
      continue;
    }
    pushLoose(block);
  }

  return cards.map(card => {
    if (card.tone !== 'alert') {
      return card;
    }
    const clear = bodyLooksClear(card.body);
    return {
      ...card,
      tone: clear ? 'ok' : 'alert',
      icon: clear ? 'checkmark-circle-outline' : 'alert-circle',
    };
  });
}

type AnalysisContentProps = {
  content: string;
  style?: ViewStyle;
};

const AnalysisContent: React.FC<AnalysisContentProps> = ({content, style}) => {
  const {h1px, w1px} = useResponsive();
  const cards = useMemo(() => groupSections(parseBlocks(content)), [content]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          gap: 10 * h1px,
        },
        card: {
          borderRadius: 14 * w1px,
          borderWidth: 1,
          paddingVertical: 12 * h1px,
          paddingHorizontal: 12 * w1px,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10 * w1px,
          marginBottom: 8 * h1px,
        },
        iconWrap: {
          width: 34 * w1px,
          height: 34 * w1px,
          borderRadius: 10 * w1px,
          alignItems: 'center',
          justifyContent: 'center',
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
        },
        bodyGap: {
          gap: 6 * h1px,
        },
        bulletRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8 * w1px,
        },
        bulletDot: {
          width: 6 * w1px,
          height: 6 * w1px,
          borderRadius: 999,
          marginTop: 7 * h1px,
        },
        bulletText: {flex: 1, minWidth: 0},
        inlineRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        },
        highlightWrap: {
          backgroundColor: colors.backgroundPinkSoft,
          paddingVertical: 6 * h1px,
          paddingHorizontal: 10 * w1px,
          borderRadius: 10 * w1px,
          borderLeftWidth: 3,
          borderLeftColor: WARN,
        },
      }),
    [h1px, w1px],
  );

  const toneStyle = (tone: SectionTone) => {
    switch (tone) {
      case 'ok':
        return {
          card: {backgroundColor: OK_BG, borderColor: OK_BORDER},
          iconBg: '#DCFCE7',
          accent: OK,
        };
      case 'alert':
        return {
          card: {backgroundColor: ALERT_BG, borderColor: ALERT_BORDER},
          iconBg: '#FEF3C7',
          accent: ALERT,
        };
      case 'warn':
        return {
          card: {backgroundColor: WARN_BG, borderColor: WARN_BORDER},
          iconBg: '#FFE4E6',
          accent: WARN,
        };
      default:
        return {
          card: {
            backgroundColor: colors.backgroundPurpleSoft,
            borderColor: 'rgba(116, 83, 224, 0.18)',
          },
          iconBg: colors.white,
          accent: colors.backgroundPurple,
        };
    }
  };

  const isReferansDisi = (text: string) =>
    /referans\s*[:\s]?\s*\d+\s*[-–]\s*\d+/i.test(text) &&
    /\d+\s*\(referans/i.test(text);

  const renderRich = (text: string, keyPrefix: string) => {
    const segments = parseBold(text);
    return (
      <View style={s.inlineRow}>
        {segments.map((seg, i) => (
          <T
            key={`${keyPrefix}-${i}`}
            size={fontSize.body}
            weight={seg.bold ? '700' : '400'}
            color={seg.bold ? colors.textDark : BODY}>
            {seg.text}
          </T>
        ))}
      </View>
    );
  };

  return (
    <View style={[s.wrap, style]}>
      {cards.map((card, idx) => {
        const tone = toneStyle(card.tone);
        return (
          <View key={`c-${idx}`} style={[s.card, tone.card]}>
            <View style={s.header}>
              <View style={[s.iconWrap, {backgroundColor: tone.iconBg}]}>
                <Ionicons
                  name={card.icon as any}
                  size={iconSize.medium}
                  color={tone.accent}
                />
              </View>
              <View style={s.titleCol}>
                <T
                  size={fontSize.bodyMedium}
                  weight="700"
                  color={colors.textDark}
                  numberOfLines={2}>
                  {card.title}
                </T>
              </View>
            </View>

            <View style={s.bodyGap}>
              {card.body.map((block, bIdx) => {
                if (block.type === 'bullet') {
                  const highlighted = isReferansDisi(block.text);
                  const row = (
                    <View style={s.bulletRow}>
                      <View
                        style={[s.bulletDot, {backgroundColor: tone.accent}]}
                      />
                      <View style={s.bulletText}>
                        {renderRich(block.text, `b-${idx}-${bIdx}`)}
                      </View>
                    </View>
                  );
                  return highlighted ? (
                    <View key={`b-${idx}-${bIdx}`} style={s.highlightWrap}>
                      {row}
                    </View>
                  ) : (
                    <View key={`b-${idx}-${bIdx}`}>{row}</View>
                  );
                }
                return (
                  <View key={`p-${idx}-${bIdx}`}>
                    {renderRich(block.text, `p-${idx}-${bIdx}`)}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default AnalysisContent;
