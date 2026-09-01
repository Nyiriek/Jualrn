import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JuaCompanion from './JuaCompanion';

const companionApi = vi.hoisted(() => ({
  chatWithCompanion: vi.fn(),
  deleteConversation: vi.fn(),
  getConversation: vi.fn(),
  getConversations: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'student', username: 'learner' }, accessToken: 'test-access-token', isAuthReady: true }),
}));
vi.mock('../api/aiCompanion', () => companionApi);
vi.mock('../api/axios', () => ({ default: { get: vi.fn((url: string) => Promise.resolve({ data: url === '/subjects/' ? [] : [] })) } }));

const renderCompanion = () => render(<MemoryRouter initialEntries={['/student']}><JuaCompanion /></MemoryRouter>);

describe('Jua Companion', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    companionApi.getConversations.mockResolvedValue({ data: [] });
  });

  afterEach(() => cleanup());

  it('opens from the floating Ask Jua button and shows suggested prompts', async () => {
    renderCompanion();
    fireEvent.click(screen.getByRole('button', { name: /open jua companion/i }));
    expect(await screen.findByText('Your study helper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /give me an example/i })).toBeInTheDocument();
  });

  it('sends a question and displays the companion response', async () => {
    companionApi.chatWithCompanion.mockResolvedValue({ data: {
      conversation: { id: 4, title: 'Explain cells', messages: [{ id: 1, role: 'user', content: 'Explain cells', created_at: '' }, { id: 2, role: 'assistant', content: 'Cells are the small building blocks of living things.', created_at: '' }] },
      message: { id: 2, role: 'assistant', content: 'Cells are the small building blocks of living things.', created_at: '' },
    } });
    renderCompanion();
    fireEvent.click(screen.getByRole('button', { name: /open jua companion/i }));
    fireEvent.change(await screen.findByPlaceholderText(/ask jua companion/i), { target: { value: 'Explain cells' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await waitFor(() => expect(companionApi.chatWithCompanion).toHaveBeenCalled());
    expect(await screen.findByText(/small building blocks/i)).toBeInTheDocument();
  });

  it('shows a retry state when a request fails', async () => {
    companionApi.chatWithCompanion.mockRejectedValue({ response: { data: { detail: 'Connection problem' } } });
    renderCompanion();
    fireEvent.click(screen.getByRole('button', { name: /open jua companion/i }));
    fireEvent.change(await screen.findByPlaceholderText(/ask jua companion/i), { target: { value: 'Help me study' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    expect(await screen.findByText('Connection problem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
