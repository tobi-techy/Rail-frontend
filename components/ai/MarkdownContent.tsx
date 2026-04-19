import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

const markdownStyles = StyleSheet.create({
  body: { fontFamily: 'SFProDisplay-Regular', fontSize: 16, color: '#1A1A1A', lineHeight: 26 },
  heading1: { fontFamily: 'SFProDisplay-Bold', fontSize: 24, color: '#1A1A1A', marginTop: 16, marginBottom: 8, letterSpacing: -0.3 },
  heading2: { fontFamily: 'SFProDisplay-Bold', fontSize: 20, color: '#1A1A1A', marginTop: 14, marginBottom: 6, letterSpacing: -0.2 },
  heading3: { fontFamily: 'SFProDisplay-Semibold', fontSize: 17, color: '#1A1A1A', marginTop: 12, marginBottom: 4 },
  strong: { fontFamily: 'SFProDisplay-Semibold', color: '#1A1A1A' },
  em: { fontStyle: 'italic' },
  code_inline: {
    fontFamily: 'SFMono-Medium',
    fontSize: 14,
    backgroundColor: '#F3F4F6',
    color: '#FF2E01',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  fence: {
    fontFamily: 'SFMono-Regular',
    fontSize: 13,
    backgroundColor: '#1A1A1A',
    color: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF2E01',
    paddingLeft: 14,
    marginVertical: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingVertical: 8,
    paddingRight: 12,
  },
  link: { color: '#FF2E01', textDecorationLine: 'none' as const },
  paragraph: { marginVertical: 4 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { flexDirection: 'row', marginVertical: 3 },
  bullet_list_icon: {
    fontFamily: 'SFProDisplay-Regular',
    fontSize: 16,
    color: '#FF2E01',
    marginRight: 8,
    lineHeight: 26,
  },
  ordered_list_icon: {
    fontFamily: 'SFMono-Medium',
    fontSize: 13,
    color: '#8C8C8C',
    marginRight: 8,
    lineHeight: 26,
  },
  hr: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    height: 1,
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  thead: { backgroundColor: '#F9F8F6' },
  th: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 13,
    color: '#1A1A1A',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  td: {
    fontFamily: 'SFProDisplay-Regular',
    fontSize: 13,
    color: '#1A1A1A',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
});

export function MarkdownContent({ content }: { content: string }) {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
