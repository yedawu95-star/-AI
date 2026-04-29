-- RSS 소스 관리
create table if not exists rss_sources (
  id bigint primary key generated always as identity,
  name text not null,
  rss_url text not null,
  category text not null check (category in ('dept', 'outlet')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 초기 RSS 소스 데이터
insert into rss_sources (name, rss_url, category) values
  ('롯데백화점', 'https://news.naver.com/main/rss/rss.nhn?sid1=101&oid=011', 'dept'),
  ('현대백화점', 'https://news.naver.com/main/rss/rss.nhn?sid1=101&oid=014', 'dept'),
  ('신세계백화점', 'https://news.naver.com/main/rss/rss.nhn?sid1=101&oid=009', 'dept'),
  ('롯데아울렛', 'https://news.naver.com/main/rss/rss.nhn?sid1=101&oid=011', 'outlet'),
  ('사이먼아울렛', 'https://news.naver.com/main/rss/rss.nhn?sid1=101', 'outlet'),
  ('현대아울렛', 'https://news.naver.com/main/rss/rss.nhn?sid1=101&oid=014', 'outlet');

-- 뉴스 기사
create table if not exists news_articles (
  id bigint primary key generated always as identity,
  title text not null,
  summary_ai text,
  url text not null unique,
  source_name text not null,
  published_at timestamptz,
  keywords text[],
  is_kids boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists news_articles_published_at_idx on news_articles (published_at desc);
create index if not exists news_articles_is_kids_idx on news_articles (is_kids);
create index if not exists news_articles_source_name_idx on news_articles (source_name);

-- 플랫폼 베스트 상품
create table if not exists platform_products (
  id bigint primary key generated always as identity,
  product_name text not null,
  price integer,
  rank integer,
  platform text not null check (platform in ('naver', '29cm', 'kidikidi', 'wconcept')),
  image_url text,
  product_url text,
  captured_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists platform_products_platform_idx on platform_products (platform, captured_date desc);
create index if not exists platform_products_date_idx on platform_products (captured_date desc);

-- 키워드 트렌드
create table if not exists keyword_trends (
  id bigint primary key generated always as identity,
  keyword text not null,
  relative_score numeric(6,2),
  source text not null check (source in ('datalab', 'blog')),
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);

create index if not exists keyword_trends_period_idx on keyword_trends (period_type, period_start desc);
create index if not exists keyword_trends_keyword_idx on keyword_trends (keyword);

-- 수집 이력
create table if not exists crawl_logs (
  id bigint primary key generated always as identity,
  job_name text not null,
  status text not null check (status in ('success', 'error', 'partial')),
  items_collected integer not null default 0,
  error_msg text,
  run_at timestamptz not null default now()
);

create index if not exists crawl_logs_run_at_idx on crawl_logs (run_at desc);
