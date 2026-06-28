import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
import torch

# Add project root to sys.path so we can import src and utils
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

class MockBatchEncoding(dict):
    def to(self, device):
        return MockBatchEncoding({k: (v.to(device) if hasattr(v, "to") else v) for k, v in self.items()})

class MockTokenizer:
    def __init__(self, *args, **kwargs):
        self.pad_token_id = 0

    def __call__(self, text=None, *args, **kwargs):
        inputs = text if text is not None else kwargs.get("text_target", "")
        if isinstance(inputs, (list, tuple)):
            batch_size = len(inputs)
        else:
            batch_size = 1
        return MockBatchEncoding({
            "input_ids": torch.zeros((batch_size, 5), dtype=torch.long),
            "attention_mask": torch.ones((batch_size, 5), dtype=torch.long),
        })

    def encode(self, text, *args, **kwargs):
        return [0, 1, 2, 3, 4]

    def decode(self, token_ids, *args, **kwargs):
        return "This is a mocked generated summary output text."

    def save_pretrained(self, path):
        return str(path)

class MockModelSeq2Seq:
    def __init__(self, *args, **kwargs):
        self.parameters = lambda: [torch.nn.Parameter(torch.zeros(1))]

    def to(self, device):
        return self

    def eval(self):
        return self

    def train(self):
        return self

    def generate(self, *args, **kwargs):
        return torch.tensor([[1, 2, 3, 4]])

    def save_pretrained(self, path):
        return str(path)

    def __call__(self, *args, **kwargs):
        outputs = MagicMock()
        loss_mock = MagicMock()
        loss_mock.item.return_value = 0.42
        loss_mock.backward = lambda: None
        outputs.loss = loss_mock
        return outputs

class MockModelEncoder:
    def __init__(self, *args, **kwargs):
        pass

    def to(self, device):
        return self

    def eval(self):
        return self

    def __call__(self, input_ids, attention_mask, *args, **kwargs):
        batch_size = input_ids.shape[0]
        seq_len = input_ids.shape[1]
        last_hidden_state = torch.ones((batch_size, seq_len, 768))
        outputs = MagicMock()
        outputs.last_hidden_state = last_hidden_state
        return outputs

@pytest.fixture(autouse=True, scope="session")
def mock_huggingface_libs():
    """Autouse fixture that patches AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM, and dataset load."""
    with patch("transformers.AutoTokenizer.from_pretrained", return_value=MockTokenizer()), \
         patch("transformers.AutoModelForSeq2SeqLM.from_pretrained", return_value=MockModelSeq2Seq()), \
         patch("transformers.AutoModel.from_pretrained", return_value=MockModelEncoder()):
        yield

@pytest.fixture
def mock_bbc_dataset():
    """Returns a mock dataset list representing BBC articles."""
    return [
        {"article": "The economy grew by 2 percent in the last quarter. Consumer spending drove the expansion.", "summary": "Economy grew 2% due to consumer spending."},
        {"article": "Scientists discovered a new planet orbiting a distant star. It might support liquid water.", "summary": "New planet orbiting distant star could have water."}
    ]
