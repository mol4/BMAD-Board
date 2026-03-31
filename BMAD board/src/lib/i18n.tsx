'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Locale = 'ru' | 'en';

const translations = {
  ru: {
    'nav.dashboard': 'Дашборд',
    'nav.board': 'Доска',
    'nav.backlog': 'Бэклог',
    'nav.epics': 'Эпики',
    'nav.docs': 'Документы',
    'nav.diagnostics': 'Диагностика',

    'sidebar.localProject': 'Локальный проект',
    'sidebar.pathSettings': 'Настройки путей',
    'sidebar.epicsPath': 'Путь к эпикам',
    'sidebar.storiesPath': 'Путь к сторям',
    'sidebar.storiesMode': 'Режим стори',
    'sidebar.nestedMode': 'nested — подпапки эпиков',
    'sidebar.flatMode': 'flat — отдельная папка',
    'sidebar.save': 'Сохранить',
    'sidebar.reset': 'Сброс',
    'sidebar.syncMd': 'Синхронизация MD',
    'sidebar.syncWithMd': 'Синхронизировать с MD файлами',
    'sidebar.syncResult': 'Синхронизация',
    'sidebar.syncError': 'Ошибка синхронизации',
    'sidebar.configSaveError': 'Ошибка сохранения конфигурации',

    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.create': 'Создать',
    'common.edit': 'Редактировать',
    'common.continue': 'Продолжить',
    'common.select': 'Выберите...',
    'common.noDescription': 'Нет описания',
    'common.loading': 'Загрузка...',
    'common.progress': 'Прогресс',

    'status.backlog': 'Бэклог',
    'status.todo': 'К выполнению',
    'status.in-progress': 'В работе',
    'status.in-review': 'На ревью',
    'status.done': 'Готово',
    'status.draft': 'Черновик',
    'status.ready': 'Готов',

    'priority.critical': 'Критический',
    'priority.high': 'Высокий',
    'priority.medium': 'Средний',
    'priority.low': 'Низкий',
    'priority.critical.icon': '🔴 Критический',
    'priority.high.icon': '🟠 Высокий',
    'priority.medium.icon': '🟡 Средний',
    'priority.low.icon': '🔵 Низкий',

    'issueType.epic': 'Эпик',
    'issueType.story': 'Стори',
    'issueType.task': 'Задача',
    'issueType.bug': 'Баг',

    'dashboard.title': 'Дашборд проекта',
    'dashboard.subtitle': 'BMAD Board — обзор эпиков, стори и задач',
    'dashboard.epics': 'Эпики',
    'dashboard.stories': 'Стори',
    'dashboard.tasks': 'Задачи',
    'dashboard.storyPoints': 'Story Points',
    'dashboard.completed': 'выполнено',
    'dashboard.statusDistribution': 'Распределение по статусам',
    'dashboard.noEpics': 'Нет эпиков',
    'dashboard.addMarkdownFiles': 'Добавьте markdown файлы в',
    'dashboard.orCreateEpic': 'или создайте эпик вручную на странице Эпиков',
    'dashboard.stories.count': 'стори',
    'dashboard.projectDocs': 'Документы проекта',
    'dashboard.allDocs': 'Все документы →',
    'dashboard.noDocs': 'Нет документов в _bmad-output',

    'board.title': 'Sprint Board',
    'board.updated': 'обновлено',
    'board.allEpics': 'Все эпики',
    'board.openMdFile': 'Открыть MD файл',

    'backlog.title': 'Бэклог',
    'backlog.storiesInEpics': '{stories} стори в {epics} эпиках',
    'backlog.createStory': '+ Создать стори',
    'backlog.empty': 'Бэклог пуст',
    'backlog.emptyHint': 'Загрузите данные из BMAD markdown файлов или создайте эпики и стори вручную',
    'backlog.storiesCount': 'стори',
    'backlog.addStory': '+ Стори',
    'backlog.noStories': 'Нет стори в этом эпике',

    'epics.title': 'Эпики',
    'epics.subtitle': 'Управление эпиками проекта',
    'epics.create': '+ Создать эпик',
    'epics.noEpics': 'Нет эпиков',
    'epics.noEpicsHint': 'Создайте эпик вручную или загрузите из BMAD markdown файлов',
    'epics.createModal': 'Создать эпик',
    'epics.name': 'Название',
    'epics.namePlaceholder': 'Название эпика',
    'epics.description': 'Описание',
    'epics.descriptionPlaceholder': 'Описание эпика',

    'epic.notFound': 'Эпик не найден',
    'epic.info': 'Информация',
    'epic.editFile': 'Редактирование файла',
    'epic.editWarning': 'Вы собираетесь редактировать исходный Markdown эпика. Изменения будут сохранены в память. Продолжить?',
    'epic.renderError': 'Ошибка рендеринга',
    'epic.saveError': 'Ошибка сохранения',
    'epic.storiesCount': 'Стори',
    'epic.createStory': '+ Создать стори',
    'epic.noStories': 'Нет стори в этом эпике',
    'epic.description': 'Описание',
    'epic.created': 'Создан',
    'epic.updated': 'Обновлён',

    'story.createModal': 'Создать стори',
    'story.name': 'Название',
    'story.namePlaceholder': 'Название стори',
    'story.description': 'Описание',
    'story.descriptionPlaceholder': 'Описание стори',
    'story.priority': 'Приоритет',
    'story.storyPoints': 'Story Points',
    'story.assignee': 'Исполнитель',
    'story.assigneePlaceholder': 'Имя исполнителя',
    'story.notFound': 'Стори не найдена',
    'story.info': 'Информация',
    'story.mdFile': 'MD файл',
    'story.editFile': 'Редактирование файла',
    'story.editWarningFile': 'Вы собираетесь редактировать исходный Markdown файл. Изменения будут записаны напрямую в файл на диске. Продолжить?',
    'story.editWarningInline': 'Вы собираетесь редактировать исходный Markdown файл. Изменения будут записаны напрямую в память (inline-стори). Продолжить?',
    'story.loadError': 'Ошибка загрузки файла',
    'story.saveError': 'Ошибка сохранения',
    'story.hasFile': '📄 Есть файл',
    'story.acceptanceCriteria': 'Критерии приёмки',
    'story.tasks': 'Задачи',
    'story.addTask': '+ Задача',
    'story.noTasks': 'Нет задач',
    'story.status': 'Статус',
    'story.epic': 'Эпик',
    'story.labels': 'Метки',
    'story.inlineFromEpics': 'inline из epics.md',

    'task.createModal': 'Создать задачу',
    'task.name': 'Название',
    'task.namePlaceholder': 'Название задачи',
    'task.description': 'Описание',
    'task.descriptionPlaceholder': 'Описание задачи',

    'docs.title': 'Документы проекта',
    'docs.count': 'документов из _bmad-output',
    'docs.allCategories': 'Все категории',
    'docs.noDocs': 'Нет документов',
    'docs.noDocsHint': 'Добавьте .md / .html файлы в _bmad-output',
    'docs.breadcrumb': 'Документы',
    'docs.editFile': 'Редактирование файла',
    'docs.editWarning': 'Вы собираетесь редактировать файл',
    'docs.editWarningText': 'Изменения будут записаны напрямую в файл на диске. Продолжить?',
    'docs.saveError': 'Ошибка сохранения',
    'docs.notFound': 'Документ не найден',

    'category.Документы': 'Документы',
    'category.Исследования': 'Исследования',
    'category.Реализация': 'Реализация',
    'category.Планирование': 'Планирование',

    'diag.title': 'Диагностика BMAD',
    'diag.subtitle': 'Обзор файлов, конфигурации и импортированных данных',
    'diag.resync': '🔄 Пересинхронизировать',
    'diag.syncing': 'Синхронизация...',
    'diag.config': 'Конфигурация',
    'diag.mode': 'Режим',
    'diag.epicsPathConfig': 'Путь к эпикам (config)',
    'diag.storiesPathConfig': 'Путь к сторям (config)',
    'diag.resolvedEpicsPath': 'Resolved epics path',
    'diag.resolvedStoriesPath': 'Resolved stories path',
    'diag.filesOnDisk': 'Файлы на диске',
    'diag.files': 'файлов',
    'diag.importSummary': 'Сводка импорта',
    'diag.totalEpics': 'Эпиков',
    'diag.totalStories': 'Всего сторей',
    'diag.fromFiles': 'Из файлов',
    'diag.fromEpicsMd': 'Из epics.md (inline)',
    'diag.epicsTable': 'Эпики',
    'diag.key': 'Key',
    'diag.name': 'Название',
    'diag.status': 'Статус',
    'diag.total': 'Всего',
    'diag.inline': 'Inline',
    'diag.byStatus': 'По статусам',
    'diag.storiesTable': 'Стори',
    'diag.epicCol': 'Эпик',
    'diag.source': 'Источник',
    'diag.fileSource': '📄 Файл',
    'diag.inlineSource': '📝 Inline',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.board': 'Board',
    'nav.backlog': 'Backlog',
    'nav.epics': 'Epics',
    'nav.docs': 'Documents',
    'nav.diagnostics': 'Diagnostics',

    'sidebar.localProject': 'Local project',
    'sidebar.pathSettings': 'Path settings',
    'sidebar.epicsPath': 'Epics path',
    'sidebar.storiesPath': 'Stories path',
    'sidebar.storiesMode': 'Stories mode',
    'sidebar.nestedMode': 'nested — epic subfolders',
    'sidebar.flatMode': 'flat — separate folder',
    'sidebar.save': 'Save',
    'sidebar.reset': 'Reset',
    'sidebar.syncMd': 'Sync MD',
    'sidebar.syncWithMd': 'Synchronize with MD files',
    'sidebar.syncResult': 'Synchronization',
    'sidebar.syncError': 'Sync error',
    'sidebar.configSaveError': 'Config save error',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.continue': 'Continue',
    'common.select': 'Select...',
    'common.noDescription': 'No description',
    'common.loading': 'Loading...',
    'common.progress': 'Progress',

    'status.backlog': 'Backlog',
    'status.todo': 'To Do',
    'status.in-progress': 'In Progress',
    'status.in-review': 'In Review',
    'status.done': 'Done',
    'status.draft': 'Draft',
    'status.ready': 'Ready',

    'priority.critical': 'Critical',
    'priority.high': 'High',
    'priority.medium': 'Medium',
    'priority.low': 'Low',
    'priority.critical.icon': '🔴 Critical',
    'priority.high.icon': '🟠 High',
    'priority.medium.icon': '🟡 Medium',
    'priority.low.icon': '🔵 Low',

    'issueType.epic': 'Epic',
    'issueType.story': 'Story',
    'issueType.task': 'Task',
    'issueType.bug': 'Bug',

    'dashboard.title': 'Project Dashboard',
    'dashboard.subtitle': 'BMAD Board — overview of epics, stories and tasks',
    'dashboard.epics': 'Epics',
    'dashboard.stories': 'Stories',
    'dashboard.tasks': 'Tasks',
    'dashboard.storyPoints': 'Story Points',
    'dashboard.completed': 'completed',
    'dashboard.statusDistribution': 'Status Distribution',
    'dashboard.noEpics': 'No epics',
    'dashboard.addMarkdownFiles': 'Add markdown files to',
    'dashboard.orCreateEpic': 'or create an epic manually on the Epics page',
    'dashboard.stories.count': 'stories',
    'dashboard.projectDocs': 'Project Documents',
    'dashboard.allDocs': 'All documents →',
    'dashboard.noDocs': 'No documents in _bmad-output',

    'board.title': 'Sprint Board',
    'board.updated': 'updated',
    'board.allEpics': 'All epics',
    'board.openMdFile': 'Open MD file',

    'backlog.title': 'Backlog',
    'backlog.storiesInEpics': '{stories} stories in {epics} epics',
    'backlog.createStory': '+ Create Story',
    'backlog.empty': 'Backlog is empty',
    'backlog.emptyHint': 'Load data from BMAD markdown files or create epics and stories manually',
    'backlog.storiesCount': 'stories',
    'backlog.addStory': '+ Story',
    'backlog.noStories': 'No stories in this epic',

    'epics.title': 'Epics',
    'epics.subtitle': 'Manage project epics',
    'epics.create': '+ Create Epic',
    'epics.noEpics': 'No epics',
    'epics.noEpicsHint': 'Create epic manually or load from BMAD markdown files',
    'epics.createModal': 'Create Epic',
    'epics.name': 'Name',
    'epics.namePlaceholder': 'Epic name',
    'epics.description': 'Description',
    'epics.descriptionPlaceholder': 'Epic description',

    'epic.notFound': 'Epic not found',
    'epic.info': 'Info',
    'epic.editFile': 'Edit file',
    'epic.editWarning': 'You are about to edit the source Markdown of the epic. Changes will be saved in memory. Continue?',
    'epic.renderError': 'Render error',
    'epic.saveError': 'Save error',
    'epic.storiesCount': 'Stories',
    'epic.createStory': '+ Create Story',
    'epic.noStories': 'No stories in this epic',
    'epic.description': 'Description',
    'epic.created': 'Created',
    'epic.updated': 'Updated',

    'story.createModal': 'Create Story',
    'story.name': 'Name',
    'story.namePlaceholder': 'Story name',
    'story.description': 'Description',
    'story.descriptionPlaceholder': 'Story description',
    'story.priority': 'Priority',
    'story.storyPoints': 'Story Points',
    'story.assignee': 'Assignee',
    'story.assigneePlaceholder': 'Assignee name',
    'story.notFound': 'Story not found',
    'story.info': 'Info',
    'story.mdFile': 'MD File',
    'story.editFile': 'Edit file',
    'story.editWarningFile': 'You are about to edit the source Markdown file. Changes will be written directly to disk. Continue?',
    'story.editWarningInline': 'You are about to edit the source Markdown file. Changes will be written to memory (inline story). Continue?',
    'story.loadError': 'File load error',
    'story.saveError': 'Save error',
    'story.hasFile': '📄 Has file',
    'story.acceptanceCriteria': 'Acceptance Criteria',
    'story.tasks': 'Tasks',
    'story.addTask': '+ Task',
    'story.noTasks': 'No tasks',
    'story.status': 'Status',
    'story.epic': 'Epic',
    'story.labels': 'Labels',
    'story.inlineFromEpics': 'inline from epics.md',

    'task.createModal': 'Create Task',
    'task.name': 'Name',
    'task.namePlaceholder': 'Task name',
    'task.description': 'Description',
    'task.descriptionPlaceholder': 'Task description',

    'docs.title': 'Project Documents',
    'docs.count': 'documents from _bmad-output',
    'docs.allCategories': 'All categories',
    'docs.noDocs': 'No documents',
    'docs.noDocsHint': 'Add .md / .html files to _bmad-output',
    'docs.breadcrumb': 'Documents',
    'docs.editFile': 'Edit file',
    'docs.editWarning': 'You are about to edit file',
    'docs.editWarningText': 'Changes will be written directly to disk. Continue?',
    'docs.saveError': 'Save error',
    'docs.notFound': 'Document not found',

    'category.Документы': 'Documents',
    'category.Исследования': 'Research',
    'category.Реализация': 'Implementation',
    'category.Планирование': 'Planning',

    'diag.title': 'BMAD Diagnostics',
    'diag.subtitle': 'Overview of files, configuration and imported data',
    'diag.resync': '🔄 Resynchronize',
    'diag.syncing': 'Syncing...',
    'diag.config': 'Configuration',
    'diag.mode': 'Mode',
    'diag.epicsPathConfig': 'Epics path (config)',
    'diag.storiesPathConfig': 'Stories path (config)',
    'diag.resolvedEpicsPath': 'Resolved epics path',
    'diag.resolvedStoriesPath': 'Resolved stories path',
    'diag.filesOnDisk': 'Files on disk',
    'diag.files': 'files',
    'diag.importSummary': 'Import Summary',
    'diag.totalEpics': 'Epics',
    'diag.totalStories': 'Total stories',
    'diag.fromFiles': 'From files',
    'diag.fromEpicsMd': 'From epics.md (inline)',
    'diag.epicsTable': 'Epics',
    'diag.key': 'Key',
    'diag.name': 'Name',
    'diag.status': 'Status',
    'diag.total': 'Total',
    'diag.inline': 'Inline',
    'diag.byStatus': 'By status',
    'diag.storiesTable': 'Stories',
    'diag.epicCol': 'Epic',
    'diag.source': 'Source',
    'diag.fileSource': '📄 File',
    'diag.inlineSource': '📝 Inline',
  },
} as const;

type TranslationKey = keyof typeof translations.ru;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = 'bmad-board-locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && (saved === 'ru' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text: string = translations[locale][key] || translations.en[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { TranslationKey };