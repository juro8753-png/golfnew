-- prizes 테이블
CREATE TABLE prizes (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  total_quantity   INTEGER      NOT NULL DEFAULT 0,
  remaining_quantity INTEGER    NOT NULL DEFAULT 0,
  is_unlimited     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_consolation   BOOLEAN      NOT NULL DEFAULT FALSE,  -- true = 꽝 (당첨 아님)
  color            VARCHAR(7)   NOT NULL DEFAULT '#36A2EB',
  display_order    INTEGER      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 추첨 결과 테이블
CREATE TABLE spin_results (
  id         SERIAL PRIMARY KEY,
  prize_id   INTEGER      NOT NULL REFERENCES prizes(id),
  prize_name VARCHAR(255) NOT NULL,
  is_winner  BOOLEAN      NOT NULL DEFAULT FALSE,
  spun_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spin_results_spun_at  ON spin_results(spun_at DESC);
CREATE INDEX idx_spin_results_prize_id ON spin_results(prize_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prizes_updated_at
  BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 샘플 데이터
INSERT INTO prizes (name, total_quantity, remaining_quantity, is_unlimited, is_consolation, color, display_order)
VALUES
  ('꽝',       500, 500, FALSE, TRUE,  '#AAAAAA', 0),
  ('1등 상품',  10,  10,  FALSE, FALSE, '#FFD700', 1),
  ('2등 상품',  50,  50,  FALSE, FALSE, '#FF6384', 2),
  ('3등 상품',  100, 100, FALSE, FALSE, '#36A2EB', 3);
