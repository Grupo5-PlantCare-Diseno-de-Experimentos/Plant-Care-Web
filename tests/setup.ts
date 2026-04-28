import { config } from '@vue/test-utils';
import { afterEach, beforeAll, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() })
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: vi.fn() })
}));

vi.mock('vue-i18n', async () => {
  const { ref } = await import('vue');
  return {
    useI18n: () => ({ t: (key: string) => key, locale: ref('en') }),
    createI18n: () => ({ global: { t: (key: string) => key } })
  };
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: {
    label: String,
    icon: String,
    loading: Boolean,
    disabled: Boolean
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => h(
      'button',
      {
        disabled: props.disabled || props.loading,
        onClick: () => emit('click')
      },
      slots.default ? slots.default() : props.label
    );
  }
});

const InputTextStub = defineComponent({
  name: 'InputTextStub',
  props: {
    modelValue: [String, Number],
    type: String,
    placeholder: String,
    id: String,
    disabled: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('input', {
      ...attrs,
      id: props.id,
      type: props.type || 'text',
      value: props.modelValue ?? '',
      placeholder: props.placeholder,
      disabled: props.disabled,
      onInput: (event: Event) => {
        const target = event.target as HTMLInputElement;
        emit('update:modelValue', target.value);
      }
    });
  }
});

const TextareaStub = defineComponent({
  name: 'TextareaStub',
  props: {
    modelValue: String,
    placeholder: String,
    id: String,
    disabled: Boolean,
    rows: [Number, String]
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('textarea', {
      ...attrs,
      id: props.id,
      value: props.modelValue ?? '',
      placeholder: props.placeholder,
      disabled: props.disabled,
      rows: props.rows ? Number(props.rows) : undefined,
      onInput: (event: Event) => {
        const target = event.target as HTMLTextAreaElement;
        emit('update:modelValue', target.value);
      }
    });
  }
});

const InputSwitchStub = defineComponent({
  name: 'InputSwitchStub',
  props: {
    modelValue: Boolean,
    disabled: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'checkbox',
      checked: !!props.modelValue,
      disabled: props.disabled,
      onChange: (event: Event) => {
        const target = event.target as HTMLInputElement;
        emit('update:modelValue', target.checked);
      }
    });
  }
});

const MenuStub = defineComponent({
  name: 'MenuStub',
  setup(_, { expose }) {
    const toggle = vi.fn();
    expose({ toggle });
    return () => h('div');
  }
});

const RouterLinkStub = defineComponent({
  name: 'RouterLinkStub',
  props: {
    to: [String, Object]
  },
  setup(_, { slots }) {
    return () => h('a', {}, slots.default ? slots.default() : 'link');
  }
});

const RouterViewStub = defineComponent({
  name: 'RouterViewStub',
  setup(_, { slots }) {
    const StubComponent = defineComponent({
      name: 'RouterViewStubComponent',
      template: '<div data-router-stub="component"></div>'
    });
    return () => h(
      'div',
      { 'data-router-view': true },
      slots.default ? slots.default({ Component: StubComponent }) : undefined
    );
  }
});

config.global.mocks = {
  $t: (key: string) => key
};

config.global.stubs = {
  RouterLink: RouterLinkStub,
  RouterView: RouterViewStub,
  Button: ButtonStub,
  InputText: InputTextStub,
  Textarea: TextareaStub,
  InputSwitch: InputSwitchStub,
  Menu: MenuStub,
  ConfirmDialog: defineComponent({ template: '<div />' }),
  Toast: defineComponent({ template: '<div />' }),
  ProgressSpinner: defineComponent({ template: '<div />' })
};

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as typeof window.matchMedia;
  }
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
