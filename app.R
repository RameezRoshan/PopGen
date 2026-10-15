library(shiny)
library(bslib)
library(tidyverse)
library(plotly)

# --- Optimized Core Simulation Engine ---
run_simulation_optimized <- function(input) {
  # Initialize parameters
  N <- input$pop_size
  p_init <- input$init_p
  generations <- input$generations
  num_subpops <- input$num_subpops
  reps <- input$replications

  # Helper for vector allocation
  total_gens <- generations + 1

  # Pre-allocate history storage for all replications
  history_list <- vector("list", reps)

  # Pre-calculate spatial distribution (Subpopulations)
  subpop_assignments <- rep(1:num_subpops, length.out = N)

  # Coordinates
  x <- runif(N)
  y <- runif(N)
  if (num_subpops > 1) {
    centers_x <- seq(0.2, 0.8, length.out = num_subpops)
    centers_y <- rep(c(0.2, 0.8), length.out = num_subpops)
    x <- (x / num_subpops) + centers_x[subpop_assignments]
    y <- (y / num_subpops) + centers_y[subpop_assignments]
  }

  # If spatial mating is on, pre-calculate full distance matrix
  dist_matrix <- if (input$non_random_mating) {
    dx <- outer(x, x, "-")
    dy <- outer(y, y, "-")
    sqrt(dx^2 + dy^2)
  } else {
    NULL
  }

  # Fitness values
  w <- c(input$w11, input$w12, input$w22)
  max_w <- max(w)

  # Mutation rates
  mu <- input$mu
  nu <- input$nu

  # --- Simulation Loop per Replication ---
  for (r in 1:reps) {
    # Storage for this replication
    rep_hist <- matrix(NA, nrow = total_gens, ncol = 8)
    colnames(rep_hist) <- c("Generation", "p", "A1A1", "A1A2", "A2A2", "Fst", "Fis", "Fit")

    # Initial Genotypes (Integer: 1=A1A1, 2=A1A2, 3=A2A2)
    q_init <- 1 - p_init
    genotypes <- sample(1:3,
      size = N, replace = TRUE,
      prob = c(p_init^2, 2 * p_init * q_init, q_init^2)
    )

    current_pop_gt <- genotypes
    current_pop_subpop <- subpop_assignments

    for (t in 1:total_gens) {
      gen_idx <- t - 1

      # --- Statistics (Vectorized) ---
      n_A1 <- ifelse(current_pop_gt == 1, 2, ifelse(current_pop_gt == 2, 1, 0))

      # Global stats
      p_global <- sum(n_A1) / (2 * N)
      f_A1A1 <- sum(current_pop_gt == 1) / N
      f_A1A2 <- sum(current_pop_gt == 2) / N
      f_A2A2 <- sum(current_pop_gt == 3) / N

      # F-stats (Subpopulation based)
      # Even if num_subpops=1, we calculate stats to return 0s properly or handle logic
      if (num_subpops > 1) {
        n_sub <- tapply(rep(1, N), current_pop_subpop, sum)
        n_sub[is.na(n_sub)] <- 0

        sum_A1_sub <- tapply(n_A1, current_pop_subpop, sum)
        sum_A1_sub[is.na(sum_A1_sub)] <- 0
        p_sub <- sum_A1_sub / (2 * n_sub)

        n_het_sub <- tapply(current_pop_gt == 2, current_pop_subpop, sum)
        n_het_sub[is.na(n_het_sub)] <- 0
        obs_het_sub <- n_het_sub / n_sub

        exp_het_sub <- 2 * p_sub * (1 - p_sub)

        valid_pops <- n_sub > 0
        mean_p <- mean(p_sub[valid_pops], na.rm = TRUE)
        HT <- 2 * mean_p * (1 - mean_p)
        HS <- mean(exp_het_sub[valid_pops], na.rm = TRUE)
        HI <- mean(obs_het_sub[valid_pops], na.rm = TRUE)

        fst <- if (HT > 0) (HT - HS) / HT else 0
        fis <- if (HS > 0) (HS - HI) / HS else 0
        fit <- if (HT > 0) (HT - HI) / HT else 0
      } else {
        fst <- 0
        fis <- 0
        fit <- 0
      }

      rep_hist[t, ] <- c(gen_idx, p_global, f_A1A1, f_A1A2, f_A2A2, fst, fis, fit)

      if (gen_idx == generations) break

      # --- Evolution ---

      # 1. Selection
      fitness_vec <- w[current_pop_gt]
      survive_prob <- fitness_vec / max_w
      is_survivor <- runif(N) < survive_prob
      survivors_idx <- which(is_survivor)

      if (length(survivors_idx) < 2) {
        survivors_idx <- sample(1:N, 2)
      }

      # 2. Reproduction
      parent1_indices <- sample(survivors_idx, N, replace = TRUE)

      if (input$non_random_mating) {
        parent2_indices <- integer(N)
        decay <- input$dist_decay

        if (decay == 0) {
          parent2_indices <- sample(survivors_idx, N, replace = TRUE)
        } else {
          for (i in 1:N) {
            p1 <- parent1_indices[i]
            d <- dist_matrix[p1, survivors_idx]
            weights <- exp(-decay * d)
            selected_local_idx <- sample.int(length(survivors_idx), 1, prob = weights)
            parent2_indices[i] <- survivors_idx[selected_local_idx]
          }
        }
      } else {
        parent2_indices <- sample(survivors_idx, N, replace = TRUE)
      }

      # Mendelian Inheritance
      gt1 <- current_pop_gt[parent1_indices]
      gt2 <- current_pop_gt[parent2_indices]

      rand1 <- runif(N)
      allele1 <- ifelse(gt1 == 1, 1, ifelse(gt1 == 3, 2, ifelse(rand1 < 0.5, 1, 2)))
      rand2 <- runif(N)
      allele2 <- ifelse(gt2 == 1, 1, ifelse(gt2 == 3, 2, ifelse(rand2 < 0.5, 1, 2)))

      sum_alleles <- allele1 + allele2

      # 3. Mutation
      mut_rand1 <- runif(N)
      allele1_new <- allele1
      mask_A1 <- (allele1 == 1) & (mut_rand1 < mu)
      allele1_new[mask_A1] <- 2
      mask_A2 <- (allele1 == 2) & (mut_rand1 < nu)
      allele1_new[mask_A2] <- 1

      mut_rand2 <- runif(N)
      allele2_new <- allele2
      mask_A1_2 <- (allele2 == 1) & (mut_rand2 < mu)
      allele2_new[mask_A1_2] <- 2
      mask_A2_2 <- (allele2 == 2) & (mut_rand2 < nu)
      allele2_new[mask_A2_2] <- 1

      sum_alleles_new <- allele1_new + allele2_new
      current_pop_gt <- ifelse(sum_alleles_new == 2, 1, ifelse(sum_alleles_new == 3, 2, 3))

      # 4. Migration
      if (num_subpops > 1 && input$m_rate > 0) {
        n_migrants <- floor(N * input$m_rate)
        if (n_migrants > 0) {
          migrant_indices <- sample(1:N, n_migrants)
          current_pop_subpop[migrant_indices] <- sample(1:num_subpops, n_migrants, replace = TRUE)
        }
      }
    }

    d_hist <- as.data.frame(rep_hist)
    d_hist$Rep <- r
    history_list[[r]] <- d_hist
  }

  final_history <- bind_rows(history_list)

  gt_strings <- c("A1A1", "A1A2", "A2A2")[current_pop_gt]
  final_pop_df <- data.frame(
    id = 1:N,
    x = x,
    y = y,
    subpop = current_pop_subpop,
    gt = gt_strings,
    stringsAsFactors = FALSE
  )

  return(list(history = final_history, final_pop = final_pop_df))
}

# --- UI ---
ui <- page_sidebar(
  title = "Population Genetics Explorer",
  theme = bs_theme(version = 5, bootswatch = "minty"),
  sidebar = sidebar(
    width = 350,
    accordion(
      accordion_panel(
        "Parameters",
        sliderInput("pop_size", "Population Size (N)", 2, 1000, 500),
        sliderInput("init_p", "Initial Frequency (p)", 0, 1, 0.5),
        sliderInput("generations", "Generations", 2, 1000, 50),
        sliderInput("replications", "Replications", 1, 20, 1, step = 1),
        hr(),
        checkboxInput("non_random_mating", "Spatial Non-Random Mating", value = FALSE),
        conditionalPanel(
          "input.non_random_mating",
          sliderInput("dist_decay", "Distance Decay", 0, 50, 10)
        ),
        hr(),
        sliderInput("num_subpops", "Sub-populations", 1, 5, 1),
        sliderInput("m_rate", "Migration Rate", 0, 0.5, 0.01)
      ),
      accordion_panel(
        "Advanced",
        fluidRow(
          column(6, numericInput("mu", "mu (A1->A2)", 0, min = 0, max = 0.1, step = 0.001)),
          column(6, numericInput("nu", "nu (A2->A1)", 0, min = 0, max = 0.1, step = 0.001))
        ),
        helpText("Fitness (w)"),
        fluidRow(
          column(4, numericInput("w11", "w11", 1, min = 0, max = 1, step = 0.1)),
          column(4, numericInput("w12", "w12", 1, min = 0, max = 1, step = 0.1)),
          column(4, numericInput("w22", "w22", 1, min = 0, max = 1, step = 0.1))
        )
      )
    ),
    actionButton("go", "Run Simulation", class = "btn-primary w-100 mt-3")
  ),
  layout_column_wrap(
    width = 1 / 2,
    heights_equal = "row",
    card(
      full_screen = TRUE,
      card_header("Genetic Drift (Gene Frequency)", class = "bg-primary text-white"),
      plotlyOutput("p_plot")
    ),
    card(
      full_screen = TRUE,
      card_header("Genotype Frequencies (Avg)", class = "bg-secondary text-white"),
      plotlyOutput("gt_plot")
    ),
    card(
      full_screen = TRUE,
      card_header("Spatial Distribution", class = "bg-info text-white"),
      plotOutput("spatial_plot")
    ),
    card(
      full_screen = TRUE,
      card_header("F-Statistics", class = "bg-success text-white"),
      plotlyOutput("f_plot")
    )
  )
)

# --- SERVER ---
server <- function(input, output) {
  results <- eventReactive(input$go,
    {
      run_simulation_optimized(input)
    },
    ignoreNULL = FALSE
  )

  output$p_plot <- renderPlotly({
    df <- results()$history
    # Plot all replications with independent colors
    p <- ggplot(df, aes(x = Generation, y = p, group = Rep, color = as.factor(Rep))) +
      geom_line(alpha = 0.8, size = 0.8) +
      ylim(0, 1) +
      theme_minimal(base_size = 14) +
      scale_color_viridis_d(option = "turbo", guide = if (input$replications > 10) "none" else "legend") +
      labs(y = "Freq (A1)", color = "Rep") +
      theme(legend.position = "right")

    ggplotly(p)
  })

  output$gt_plot <- renderPlotly({
    df_summ <- results()$history %>%
      group_by(Generation) %>%
      summarise(
        A1A1 = mean(A1A1),
        A1A2 = mean(A1A2),
        A2A2 = mean(A2A2)
      ) %>%
      pivot_longer(cols = c(A1A1, A1A2, A2A2), names_to = "Genotype", values_to = "Freq")

    p <- ggplot(df_summ, aes(x = Generation, y = Freq, color = Genotype)) +
      geom_line(size = 1) +
      ylim(0, 1) +
      scale_color_manual(values = c("A1A1" = "#3498db", "A1A2" = "#9b59b6", "A2A2" = "#e74c3c")) +
      theme_minimal(base_size = 14)
    ggplotly(p)
  })

  output$spatial_plot <- renderPlot({
    # Add density contours to show substructuring even in 1 subpop
    p <- results()$final_pop %>%
      ggplot(aes(x = x, y = y))

    # If non-random mating or multiple subpops, show density for visual clustering
    if (input$non_random_mating || input$num_subpops > 1) {
      p <- p + stat_density_2d(aes(fill = ..level..), geom = "polygon", alpha = 0.1, color = NA)
    }

    p <- p +
      geom_point(aes(color = gt), size = 3, alpha = 0.8) +
      scale_color_manual(values = c("A1A1" = "#3498db", "A1A2" = "#9b59b6", "A2A2" = "#e74c3c")) +
      theme_void() +
      theme(legend.position = "bottom") +
      labs(title = NULL, color = "Genotype")

    p
  })

  output$f_plot <- renderPlotly({
    # Calculate means
    df_summ <- results()$history %>%
      group_by(Generation) %>%
      summarise(
        Fis = mean(Fis),
        Fst = mean(Fst),
        Fit = mean(Fit)
      )

    # Final values for inset
    final_vals <- df_summ %>% tail(1)

    # Pivot for plotting
    df_long <- df_summ %>% pivot_longer(cols = c(Fis, Fst, Fit), names_to = "Stat", values_to = "Value")

    p <- ggplot(df_long, aes(x = Generation, y = Value, color = Stat)) +
      geom_line(size = 1) +
      theme_minimal(base_size = 14) +
      scale_color_brewer(palette = "Dark2") +
      labs(y = "Value", x = "Gen") +
      theme(legend.position = "none") # Hide default legend, used in tooltip or custom annotation?

    gp <- ggplotly(p)

    # Add inset info as annotations on the plot layout to save space
    # Top-right corner
    stats_text <- paste0(
      "<b>Final Stats:</b><br>",
      "Fst: ", round(final_vals$Fst, 4), "<br>",
      "Fis: ", round(final_vals$Fis, 4), "<br>",
      "Fit: ", round(final_vals$Fit, 4)
    )

    gp <- gp %>% layout(
      annotations = list(
        x = 1, y = 1,
        xref = "paper", yref = "paper",
        text = stats_text,
        showarrow = FALSE,
        xanchor = "right",
        yanchor = "top",
        align = "right",
        bgcolor = "rgba(255, 255, 255, 0.8)",
        bordercolor = "#333",
        borderwidth = 1,
        font = list(size = 10)
      ),
      margin = list(t = 30) # Add some top margin
    )

    gp
  })
}

shinyApp(ui, server)
