import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

const markdownStyles = StyleSheet.create({
  body: { fontFamily: 'SFProDisplay-Regular', fontSize: 15, color: '#1A1A1A', lineHeight: 24 },
  heading1: { fontFamily: 'SFProDisplay-Bold', fontSize: 22, color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  heading2: { fontFamily: 'SFProDisplay-Bold', fontSize: 18, color: '#1A1A1A', marginTop: 14, marginBottom: 6 },
  heading3: { fontFamily: 'SFProDisplay-Medium', fontSize: 16, color: '#1A1A1A', marginTop: 12, marginBottom: 4 },
  strong: { fontFamily: 'SFProDisplay-Semibold' },
  em: { fontStyle: 'italic' },
  code_inline: { fontFamily: 'SFMono-Medium', fontSize: 13, backgroundColor: '#F3F4F6', color: '#FF2E01', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  fence: { fontFamily: 'SFMono-Regular', fontSize: 13, backgroundColor: '#F3F4F6', color: '#1A1A1A', padding: 12, borderRadius: 10, marginVertical: 8 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#FF2E01', paddingLeft: 12, marginVertical: 8, opacity: 0.85 },
  link: { color: '#FF2E01', textDecorationLine: 'none' as const },
  paragraph: { marginVertical: 4 },
});

export function MarkdownContent({ content }: { content: string }) {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
