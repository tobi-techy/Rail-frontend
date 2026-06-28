import React from 'react';
import { Text } from 'react-native';
import Markdown from 'react-native-markdown-display';

const markdownStyles = {
  body: {
    fontFamily: 'Geist-Regular',
    fontSize: 18,
    color: '#343433',
    lineHeight: 30,
    backgroundColor: 'transparent',
  },
  heading1: {
    fontFamily: 'Geist-Bold',
    fontSize: 30,
    color: '#1C1C1E',
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: 'Geist-Bold',
    fontSize: 26,
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 22,
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  strong: {
    fontFamily: 'Geist-Bold',
    fontSize: 19,
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    fontFamily: 'Geist-Bold',
    fontSize: 17,
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
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item: { flexDirection: 'row' as const, marginVertical: 4 },
  bullet_list_icon: {
    fontFamily: 'Geist-Regular',
    fontSize: 18,
    color: '#343433',
    marginRight: 8,
    lineHeight: 30,
  },
  ordered_list_icon: {
    fontFamily: 'Geist-Bold',
    fontSize: 18,
    color: '#1C1C1E',
    marginRight: 10,
    lineHeight: 30,
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
    marginVertical: 8,
  },
  thead: { backgroundColor: '#f7f2e8' },
  th: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 15,
    color: '#343433',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.04)',
  },
  td: {
    fontFamily: 'Geist-Regular',
    fontSize: 16,
    color: '#343433',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.04)',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
};

const selectableRules = {
  text: (node: any, _children: any, _parent: any, styles: any, inheritedStyles: any = {}) => (
    <Text key={node.key} style={[inheritedStyles, styles.text]} selectable>
      {node.content}
    </Text>
  ),
  textgroup: (node: any, children: any, _parent: any, styles: any) => (
    <Text key={node.key} style={styles.textgroup} selectable>
      {children}
    </Text>
  ),
};

// Tighter styles for text rendered inside an iMessage-style bubble: smaller body,
// less vertical breathing room, headings scaled down so they sit naturally in a bubble.
const bubbleStyles = {
  ...markdownStyles,
  body: { ...markdownStyles.body, fontSize: 17, lineHeight: 23 },
  strong: { ...markdownStyles.strong, fontSize: 17 },
  heading1: { ...markdownStyles.heading1, fontSize: 22, marginTop: 8, marginBottom: 6 },
  heading2: { ...markdownStyles.heading2, fontSize: 20, marginTop: 8, marginBottom: 6 },
  heading3: { ...markdownStyles.heading3, fontSize: 18, marginTop: 6, marginBottom: 4 },
  paragraph: { marginTop: 0, marginBottom: 0 },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { ...markdownStyles.list_item, marginVertical: 2 },
  bullet_list_icon: { ...markdownStyles.bullet_list_icon, fontSize: 17, lineHeight: 23 },
  ordered_list_icon: { ...markdownStyles.ordered_list_icon, fontSize: 17, lineHeight: 23 },
};

export function MarkdownContent({
  content,
  selectable = false,
  variant = 'default',
}: {
  content: string;
  selectable?: boolean;
  variant?: 'default' | 'bubble';
}) {
  if (!content) return null;
  return (
    <Markdown
      style={variant === 'bubble' ? bubbleStyles : markdownStyles}
      rules={selectable ? selectableRules : undefined}>
      {content}
    </Markdown>
  );
}
