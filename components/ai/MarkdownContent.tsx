import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: 'SFProDisplay-Regular',
    fontSize: 17,
    color: '#1A1A1A',
    lineHeight: 28,
  },
  heading1: {
    fontFamily: 'SFProDisplay-Bold',
    fontSize: 28,
    color: '#1A1A1A',
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  heading2: {
    fontFamily: 'SFProDisplay-Bold',
    fontSize: 24,
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  strong: {
    fontFamily: 'SFProDisplay-Bold',
    color: '#1A1A1A',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    fontFamily: 'SFMono-Bold',
    fontSize: 16,
    backgroundColor: '#F0F0ED',
    color: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    fontFamily: 'SFMono-Regular',
    fontSize: 15,
    backgroundColor: '#1A1A1A',
    color: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: '#D4D4D0',
    paddingLeft: 14,
    marginVertical: 8,
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingRight: 0,
  },
  link: {
    color: '#1A7A6D',
    textDecorationLine: 'none' as const,
  },
  paragraph: {
    marginVertical: 6,
  },
  bullet_list: {
    marginVertical: 6,
  },
  ordered_list: {
    marginVertical: 6,
  },
  list_item: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bullet_list_icon: {
    fontFamily: 'SFProDisplay-Regular',
    fontSize: 17,
    color: '#1A1A1A',
    marginRight: 8,
    lineHeight: 28,
  },
  ordered_list_icon: {
    fontFamily: 'SFMono-Bold',
    fontSize: 17,
    color: '#1A1A1A',
    marginRight: 10,
    lineHeight: 28,
  },
  hr: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    height: 1,
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  thead: {
    backgroundColor: '#F7F7F2',
  },
  th: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 14,
    color: '#1A1A1A',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.04)',
  },
  td: {
    fontFamily: 'SFProDisplay-Regular',
    fontSize: 15,
    color: '#1A1A1A',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.04)',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
});

export function MarkdownContent({ content }: { content: string }) {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
