import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { chatApi, ChatResponse } from "../api/client";
import { RootState } from "./store";
import { setChatFormData } from "./interactionsSlice";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  toolCalls?: Record<string, unknown>[] | null;
}

interface ChatState {
  messages: ChatMsg[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [
    {
      role: "assistant",
      content:
        "Hello! I'm your AI CRM assistant. I can help you:\n\n- **Search** HCP interactions\n- **Log** new interactions\n- **Edit** existing records\n- **Suggest** follow-up actions\n- **Summarize** interaction notes\n\nWhat would you like to do?",
    },
  ],
  loading: false,
  error: null,
};

// FIX: Pass conversation history to backend so multi-turn context is maintained
export const sendMessage = createAsyncThunk(
  "chat/send",
  async (message: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    // Get all messages except the initial welcome message for history
    const history = state.chat.messages
      .slice(1) // skip the initial greeting
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await chatApi.send(message, history);

    // If backend extracted form fields, auto-fill the form
    if (res.data.form_data) {
      dispatch(setChatFormData(res.data.form_data));
    }

    return res.data;
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addUserMessage(state, action: PayloadAction<string>) {
      state.messages.push({ role: "user", content: action.payload });
    },
    clearChat(state) {
      state.messages = [initialState.messages[0]];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: "assistant",
          content: action.payload.response,
          toolCalls: action.payload.tool_calls,
        });
        // form_data dispatched via middleware in the thunk below
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        const errMsg = action.error.message || "";
        let reply = "Sorry, something went wrong. Please try again.";
        if (errMsg.includes("503") || errMsg.includes("Invalid") || errMsg.includes("API Key")) {
          reply = "AI service is unavailable - GROQ_API_KEY is invalid or expired.\n\nPlease update the key in backend/.env and restart the server.";
        }
        state.error = errMsg;
        state.messages.push({ role: "assistant", content: reply });
      });
  },
});

export const { addUserMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
