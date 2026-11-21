// Atlas - pacote do CodeMirror 6 para o editor de notas (montado no GitHub Actions com esbuild; vira window.CM).
export {EditorState,StateField,StateEffect,RangeSetBuilder,Compartment,EditorSelection,Prec} from "@codemirror/state";
export {EditorView,keymap,Decoration,ViewPlugin,WidgetType,drawSelection,highlightActiveLine,placeholder,dropCursor} from "@codemirror/view";
export {defaultKeymap,history,historyKeymap,indentWithTab,undo,redo} from "@codemirror/commands";
export {syntaxTree,syntaxHighlighting,HighlightStyle,indentOnInput,bracketMatching} from "@codemirror/language";
export {markdown,markdownLanguage,markdownKeymap} from "@codemirror/lang-markdown";
export {autocompletion,completionKeymap,closeBrackets,closeBracketsKeymap,startCompletion} from "@codemirror/autocomplete";
export {searchKeymap,highlightSelectionMatches} from "@codemirror/search";
export {tags} from "@lezer/highlight";
export {GFM,Strikethrough,TaskList,Table} from "@lezer/markdown";
