"""Initial schema with PostGIS support.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure PostGIS extension exists
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 1. assessments
    op.create_table(
        'assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('lat', sa.DECIMAL(9, 6), nullable=False),
        sa.Column('lng', sa.DECIMAL(9, 6), nullable=False),
        sa.Column('location_label', sa.Text(), nullable=True),
        sa.Column('roof_area_m2', sa.DECIMAL(), nullable=True),
        sa.Column('roof_tilt', sa.Integer(), server_default='10', nullable=True),
        sa.Column('azimuth', sa.Integer(), server_default='0', nullable=True),
        sa.Column('shading_self', sa.String(10), nullable=True),
        sa.Column('monthly_kwh', sa.DECIMAL(), nullable=True),
        sa.Column('monthly_bill_ksh', sa.DECIMAL(), nullable=True),
        sa.Column('tariff_type', sa.String(20), nullable=True),
        sa.Column('has_genset', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('genset_monthly_fuel_ksh', sa.DECIMAL(), nullable=True),
        sa.Column('backup_hours_goal', sa.Integer(), server_default='6', nullable=True),
        sa.Column('property_type', sa.String(20), nullable=True),
        sa.Column('result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('language', sa.String(5), server_default='en', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # 2. irradiance_cache
    op.create_table(
        'irradiance_cache',
        sa.Column('lat_key', sa.DECIMAL(6, 2), nullable=False),
        sa.Column('lng_key', sa.DECIMAL(6, 2), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('fetched_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('lat_key', 'lng_key'),
    )

    # 3. installers
    op.create_table(
        'installers',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('whatsapp', sa.String(15), nullable=True),
        sa.Column('county', sa.Text(), nullable=True),
        sa.Column('town', sa.Text(), nullable=True),
        sa.Column('geom', geoalchemy2.Geography(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('service_radius_km', sa.Integer(), server_default='50', nullable=True),
        sa.Column('epra_license_no', sa.Text(), nullable=True),
        sa.Column('epra_verified', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('product_types', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('size_min_kw', sa.DECIMAL(), server_default='0.5', nullable=True),
        sa.Column('size_max_kw', sa.DECIMAL(), server_default='20', nullable=True),
        sa.Column('rating_avg', sa.DECIMAL(3, 2), nullable=True),
        sa.Column('rating_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('lead_fee_ksh', sa.Integer(), server_default='500', nullable=True),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=True),
    )

    # 4. leads
    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assessments.id'), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('consent', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(20), server_default='new', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # 5. lead_matches
    op.create_table(
        'lead_matches',
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id'), nullable=False),
        sa.Column('installer_id', sa.Integer(), sa.ForeignKey('installers.id'), nullable=False),
        sa.Column('status', sa.String(20), server_default='notified', nullable=True),
        sa.Column('fee_ksh', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('lead_id', 'installer_id'),
    )

    # 6. app_config
    op.create_table(
        'app_config',
        sa.Column('key', sa.Text(), primary_key=True),
        sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('app_config')
    op.drop_table('lead_matches')
    op.drop_table('leads')
    op.drop_table('installers')
    op.drop_table('irradiance_cache')
    op.drop_table('assessments')
