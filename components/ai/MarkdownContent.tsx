import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: 'Geist-Regular',
    fontSize: 17,
    color: '#343433',
    lineHeight: 28,
  },
  heading1: {
    fontFamily: 'Geist-Bold',
    fontSize: 28,
    color: '#343433',
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  heading2: {
    fontFamily: 'Geist-Bold',
    fontSize: 24,
    color: '#343433',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 20,
    color: '#343433',
    marginTop: 16,
    marginBottom: 8,
  },
  strong: {
    fontFamily: 'Geist-Bold',
    color: '#343433',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    fontFamily: 'Geist-Bold',
    fontSize: 16,
    backgroundColor: '#f7f2e8',
    color: '#343433',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    fontFamily: 'Geist-Regular',
    fontSize: 15,
    backgroundColor: '#343433',
    color: '#f7f2e8',
    padding: 14,
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: '#c6c6c6',
    paddingLeft: 14,
    marginVertical: 8,
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingRight: 0,
  },
  link: {
    color: '#0090ff',
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
    fontFamily: 'Geist-Regular',
    fontSize: 17,
    color: '#343433',
    marginRight: 8,
    lineHeight: 28,
  },
  ordered_list_icon: {
    fontFamily: 'Geist-Bold',
    fontSize: 17,
    color: '#343433',
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
    backgroundColor: '#f7f2e8',
  },
  th: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 14,
    color: '#343433',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.04)',
  },
  td: {
    fontFamily: 'Geist-Regular',
    fontSize: 15,
    color: '#343433',
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
